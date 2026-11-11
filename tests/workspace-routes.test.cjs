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
let modelCalls = 0;
class FakeOpenAI {
  static APIError = class extends Error {};
  chat = { completions: { create: async input => {
    modelCalls++;
    assert.equal(input.messages[0].role, "system");
    return { choices: [{ message: { content: "Testowa odpowiedź" } }] };
  } } };
  audio = { transcriptions: { create: async () => { modelCalls++; return { text: "Testowe polecenie" }; } } };
}
const mocks = {
  "@/lib/workspace": workspace,
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
