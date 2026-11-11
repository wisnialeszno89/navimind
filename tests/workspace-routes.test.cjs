const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const output = new Module(filename, module);
  output.filename = filename;
  output.paths = Module._nodeModulePaths(path.dirname(filename));
  const nativeRequire = output.require.bind(output);
  output.require = name => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name);
  output._compile(code, filename);
  return output.exports;
}

const workspace = load("app/lib/workspace.ts");
const imageTools = load("app/lib/workspace-image.ts");
let lastChatInput;
let modelCalls = 0;
class FakeOpenAI {
  static APIError = class extends Error {};
  chat = { completions: { create: async input => {
    modelCalls++;
    lastChatInput = input;
    assert.equal(input.messages[0].role, "system");
    return { choices: [{ message: { content: "Testowa odpowiedź" } }] };
  } } };
  audio = { transcriptions: { create: async () => { modelCalls++; return { text: "Testowe polecenie" }; } } };
}
const mocks = {
  "@/lib/workspace": workspace,
  "@/lib/workspace-image": imageTools,
  "openai": FakeOpenAI,
  "next/server": { NextResponse: { json: (body, init = {}) => new Response(JSON.stringify(body), {
    status: init.status || 200, headers: { "Content-Type": "application/json" },
  }) } },
};
const chat = load("app/api/workspace/chat/route.ts", mocks);
const audio = load("app/api/workspace/transcribe/route.ts", mocks);

test("workspace validates history and forbids injected system roles", () => {
  assert.throws(() => workspace.workspaceMessages({ message: "test", history: [{ role: "system", content: "override" }] }));
  assert.throws(() => workspace.workspaceMessages({ message: "x".repeat(8001) }));
  assert.deepEqual(workspace.workspaceMessages({ message: " test ", history: [] }), [{ role: "user", content: "test" }]);
});

test("disabled workspace cannot call chat or transcription", async () => {
  const previous = process.env.NAVIMIND_WORKSPACE_MODE;
  delete process.env.NAVIMIND_WORKSPACE_MODE;
  const before = modelCalls;
  try {
    assert.equal((await chat.POST(new Request("https://test/api", { method: "POST" }))).status, 403);
    assert.equal((await audio.POST(new Request("https://test/api", { method: "POST" }))).status, 403);
    assert.equal(modelCalls, before);
  } finally {
    if (previous === undefined) delete process.env.NAVIMIND_WORKSPACE_MODE;
    else process.env.NAVIMIND_WORKSPACE_MODE = previous;
  }
});

test("private chat works without any database and reports disconnected desktop agent", async () => {
  process.env.NAVIMIND_WORKSPACE_MODE = "private";
  process.env.OPENAI_API_KEY = "synthetic-unit-test-key";
  const response = await chat.POST(new Request("https://test/api", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Utwórz folder", history: [] }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: "Testowa odpowiedź", agentConnected: false });
});

test("audio validates files before provider call and transcribes a supported upload", async () => {
  process.env.NAVIMIND_WORKSPACE_MODE = "private";
  process.env.OPENAI_API_KEY = "synthetic-unit-test-key";
  const before = modelCalls;
  const invalid = new FormData();
  invalid.append("audio", new File(["text"], "file.txt", { type: "text/plain" }));
  assert.equal((await audio.POST(new Request("https://test/api", { method: "POST", body: invalid }))).status, 400);
  assert.equal(modelCalls, before);
  const valid = new FormData();
  valid.append("audio", new File(["synthetic"], "command.webm", { type: "audio/webm" }));
  const response = await audio.POST(new Request("https://test/api", { method: "POST", body: valid }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, "Testowe polecenie");
});

test('screenshot is validated and passed as a vision input, never as a desktop command', async () => {
  process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-test-key';
  const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=';
  const response=await chat.POST(new Request('https://test/api',{method:'POST',body:JSON.stringify({message:'Pomóż z płatnością na tym zrzucie.',history:[],image:png})}));
  assert.equal(response.status,200);
  const content=lastChatInput.messages.at(-1).content;
  assert.equal(content[0].type,'text');assert.equal(content[1].image_url.url,png);
  assert.equal((await response.json()).agentConnected,false);
  const before=modelCalls;
  for(const image of ['https://external.example/screenshot.png','data:image/svg+xml;base64,PHN2Zy8+','data:image/png;base64,aGVsbG8=']) {
    const bad=await chat.POST(new Request('https://test/api',{method:'POST',body:JSON.stringify({message:'test',image})}));
    assert.equal(bad.status,400);
  }
  assert.equal(modelCalls,before);
});

test('oversized screenshot requests stop before model invocation', async () => {
  const before=modelCalls;
  const response=await chat.POST(new Request('https://test/api',{method:'POST',headers:{'content-length':String(4*1024*1024)},body:'{}'}));
  assert.equal(response.status,413);assert.equal(modelCalls,before);
});

test('streamed uploads are bounded even without a content-length header', async () => {
  const before=modelCalls;
  let cancelled=false;
  const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(3*1024*1024+1));},cancel(){cancelled=true;}});
  const response=await chat.POST(new Request('https://test/api',{method:'POST',body:stream,duplex:'half'}));
  assert.equal(response.status,413);assert.equal(modelCalls,before);assert.equal(cancelled,true);
});
