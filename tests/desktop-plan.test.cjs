const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const output = new Module(filename, module);
  output.filename = filename;
  output.paths = Module._nodeModulePaths(path.dirname(filename));
  const nativeRequire = output.require.bind(output);
  output.require = name => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name);
  output._compile(code, filename);
  return output.exports;
}
const planner = load('app/lib/desktop-plan.ts');
const workspace = load('app/lib/workspace.ts');
const row = { label: 'Okno DKR', width_mm: 1000, height_mm: 1000, quantity: 2 };
const current = { folder: 'Oferta Top Trans', rows: [row], revision: 'a'.repeat(64) };
let output;
let calls = 0;
class FakeOpenAI {
  chat = { completions: { create: async input => {
    calls++;
    assert.equal(input.response_format.type, 'json_object');
    assert.ok(!JSON.stringify(input).includes('pairing-secret'));
    return { choices: [{ message: { content: JSON.stringify(output) } }] };
  } } };
}
const route = load('app/api/workspace/desktop-plan/route.ts', {
  '@/lib/workspace': workspace, '@/lib/desktop-plan': planner, openai: FakeOpenAI,
  'next/server': { NextResponse: { json: (body, init = {}) => new Response(JSON.stringify(body), { status: init.status || 200 }) } },
});
function request(body) { return new Request('https://test/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }

test('validated correction binds to active revision; create preserves duplicate rows', () => {
  const update = planner.desktopPlan({ task: { kind: 'update_window_width', row_number: 1, width_mm: 1100 }, reply: 'Plan korekty' }, current);
  assert.equal(update.expectedRevision, current.revision);
  assert.deepEqual(update.task, { kind: 'update_window_width', row_number: 1, width_mm: 1100 });
  const create = planner.desktopPlan({ task: { kind: 'create_window_table', folder: 'Oferta testowa', rows: [row, row] }, reply: 'Plan utworzenia' }, null);
  assert.equal(create.task.rows.length, 2);
  assert.equal(create.expectedRevision, null);
});

test('reject arbitrary execution, paths, extra fields and ambiguous row references', () => {
  for (const task of [
    { kind: 'shell', command: 'anything' },
    { kind: 'create_window_table', folder: '../outside', rows: [row] },
    { kind: 'create_window_table', folder: 'NUL.txt', rows: [row] },
    { kind: 'update_window_width', row_number: 2, width_mm: 1100 },
    { kind: 'update_window_width', row_number: 1, width_mm: 1100, quantity: 10 },
  ]) assert.throws(() => planner.desktopPlan({ task, reply: 'plan' }, current));
  assert.throws(() => planner.desktopPlan({ task: { kind: 'update_window_width', row_number: 1, width_mm: 1100 }, reply: 'plan' }, null));
  assert.throws(() => planner.tableContext({ ...current, file: 'secret path' }));
});

test('planner fails closed outside private workspace and before model on malformed context', async () => {
  process.env.NAVIMIND_WORKSPACE_MODE = '';
  const before = calls;
  assert.equal((await route.POST(request({ message: 'test' }))).status, 403);
  process.env.NAVIMIND_WORKSPACE_MODE = 'private';
  assert.equal((await route.POST(request({ message: 'test', currentTable: { rows: [] } }))).status, 400);
  assert.equal(calls, before);
});

test('route returns executable plan with revision, never a fabricated execution result', async () => {
  process.env.NAVIMIND_WORKSPACE_MODE = 'private';
  process.env.OPENAI_API_KEY = 'synthetic-test-key';
  output = { task: { kind: 'update_window_width', row_number: 1, width_mm: 1100 }, reply: 'Plan korekty' };
  const response = await route.POST(request({ message: 'Zmień szerokość pierwszej pozycji na 1100', history: [], currentTable: current }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.expectedRevision, current.revision);
  assert.equal(body.task.width_mm, 1100);
  assert.equal(body.status, undefined);
  output = { task: { kind: 'shell', command: 'anything' }, reply: 'bad' };
  assert.equal((await route.POST(request({ message: 'test', currentTable: null }))).status, 503);
});
