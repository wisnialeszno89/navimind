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
let queuedOutputs = null;
let calls = 0;
class FakeOpenAI {
  chat = { completions: { create: async input => {
    calls++;
    assert.equal(input.response_format.type, 'json_object');
    assert.ok(!JSON.stringify(input).includes('pairing-secret'));
    const next = queuedOutputs?.length ? queuedOutputs.shift() : output;
    return { choices: [{ message: { content: typeof next === 'string' ? next : JSON.stringify(next) } }] };
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

test('append and field patches preserve intent and bind to the active revision', () => {
  const context = {...current, rows: [row, {...row, label:'Okno dwuskrzydłowe'}]};
  const extra = {...row, height_mm:1300};
  const append = planner.desktopPlan({task:{kind:'append_window_rows',rows:[extra]},reply:'plan'},context);
  assert.deepEqual(append.task,{kind:'append_window_rows',rows:[extra]});
  assert.equal(append.expectedRevision,context.revision);
  const edit = planner.desktopPlan({task:{kind:'edit_window_rows',changes:[{row_number:2,fields:{height_mm:1400,quantity:3}}]},reply:'plan'},context);
  assert.deepEqual(edit.task.changes[0].fields,{height_mm:1400,quantity:3});
  assert.throws(()=>planner.desktopPlan({task:{kind:'append_window_rows',rows:[extra]},reply:'plan'},context,['create_window_table','update_window_width']));
  assert.throws(()=>planner.desktopPlan({task:{kind:'edit_window_rows',changes:[{row_number:1,fields:{quantity:0}}]},reply:'plan'},context));
});

test('new variant file uses the same folder without replacing the original; open binds catalog revision', () => {
  const context={...current,file_name:'tabela-okien.txt'};
  const tables=[{folder:current.folder,file_name:'tabela-okien.txt',row_count:1,revision:current.revision}];
  const create=planner.desktopPlan({task:{kind:'create_window_table',folder:current.folder,file_name:'warianty-okien.txt',rows:Array.from({length:10},(_,i)=>({...row,label:`Wariant testowy ${i+1}`,width_mm:1000+i*50}))},reply:'plan'},context,planner.DESKTOP_CAPABILITIES,tables);
  assert.equal(create.task.rows.length,10);
  assert.equal(create.expectedRevision,null);
  assert.throws(()=>planner.desktopPlan({task:{kind:'create_window_table',folder:current.folder,rows:[row]},reply:'plan'},context,planner.DESKTOP_CAPABILITIES,tables));
  const open=planner.desktopPlan({task:{kind:'open_window_table',folder:current.folder,file_name:'tabela-okien.txt'},reply:'plan'},null,planner.DESKTOP_CAPABILITIES,tables);
  assert.equal(open.expectedRevision,current.revision);
  assert.throws(()=>planner.desktopPlan({task:{kind:'open_window_table',folder:current.folder,file_name:'nieznane.txt'},reply:'plan'},null,planner.DESKTOP_CAPABILITIES,tables));
});

test('extended route accepts advertised capabilities and returns append rather than a create request', async () => {
  process.env.NAVIMIND_WORKSPACE_MODE='private';
  process.env.OPENAI_API_KEY='synthetic-test-key';
  output={task:{kind:'append_window_rows',rows:[{...row,height_mm:1300}]},reply:'plan'};
  const response=await route.POST(request({message:'dopisz Okno DKR 1000 1300 2',currentTable:{...current,file_name:'tabela-okien.txt'},capabilities:planner.DESKTOP_CAPABILITIES,tables:[]}));
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.task.kind,'append_window_rows');
  assert.equal(result.expectedRevision,current.revision);
});

test('clarification is a non-executable decision and cannot smuggle a task', () => {
  const question=planner.desktopPlan({decision:'clarify',reply:'Które okno zmienić: pozycję 1 czy 2?',task:null},current);
  assert.equal(question.decision,'clarify');assert.equal(question.task,null);
  assert.throws(()=>planner.desktopPlan({decision:'clarify',reply:'Które?',task:{kind:'update_window_width',row_number:1,width_mm:1100}},current));
  assert.throws(()=>planner.desktopPlan({decision:'execute',reply:'Gotowe',task:null},current));
});

test('report proposal binds each source revision server-side and does not require active table', () => {
  const tables=[{folder:'A',file_name:'tabela-okien.txt',row_count:2,revision:'b'.repeat(64)}];
  const task={kind:'aggregate_window_tables',sources:[{folder:'A',file_name:'tabela-okien.txt'}],folder:'Raporty',file_name:'zestawienie.xlsx',open_result:true};
  const result=planner.desktopPlan({decision:'execute',reply:'Plan raportu',task},null,planner.DESKTOP_CAPABILITIES,tables,[]);
  assert.equal(result.task.sources[0].revision,tables[0].revision);
  assert.equal(result.expectedRevision,null);
  assert.throws(()=>planner.desktopPlan({reply:'plan',task:{...task,sources:[...task.sources,...task.sources]}},null,planner.DESKTOP_CAPABILITIES,tables));
  assert.throws(()=>planner.desktopPlan({reply:'plan',task:{...task,sources:[{folder:'B',file_name:'nieznany.txt'}]}},null,planner.DESKTOP_CAPABILITIES,tables));
  assert.throws(()=>planner.desktopPlan({reply:'plan',task},null,planner.DESKTOP_CAPABILITIES,tables,[{folder:'Raporty',file_name:'zestawienie.xlsx'}]));
});

test('planner repairs an invalid proposal without demanding technical syntax from the user', async () => {
  process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-test-key';
  const before=calls;
  queuedOutputs=[{decision:'execute',reply:'Plan',task:{kind:'shell',command:'anything'}},{decision:'clarify',reply:'Które okno mam zmienić: pierwsze czy drugie?',task:null}];
  try {
    const response=await route.POST(request({message:'to duże zrób szersze',currentTable:current,capabilities:planner.DESKTOP_CAPABILITIES,tables:[]}));
    assert.equal(response.status,200);
    const result=await response.json();assert.equal(result.decision,'clarify');assert.equal(result.task,null);assert.equal(calls-before,2);
  } finally {queuedOutputs=null;}
});

test('small unqualified dimensions force a question instead of guessed conversion', async () => {
  const task={kind:'append_window_rows',rows:[{...row,width_mm:1500,height_mm:1400,quantity:1}]};
  assert.match(planner.unresolvedDimensionQuestion('dopisz jedno okno 150 na 140',[],task),/centymetrach/);
  assert.equal(planner.unresolvedDimensionQuestion('dopisz jedno okno 150 na 140 cm',[],task),null);
  assert.equal(planner.unresolvedDimensionQuestion('dopisz jedno okno 150 na 140',[{role:'user',content:'Wszystkie wymiary podaję w cm.'}],task),null);
  assert.equal(planner.unresolvedDimensionQuestion('dopisz jedno okno 150 na 140',[{role:'user',content:'Centymetry.'}],task),null);
  assert.equal(planner.unresolvedDimensionQuestion('dopisz jedno okno 1500 na 1400',[],task),null);
  process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-test-key';
  output={decision:'execute',reply:'Plan',task};
  const response=await route.POST(request({message:'Dopisz jedno okno 150 na 140',currentTable:current,capabilities:planner.DESKTOP_CAPABILITIES,tables:[]}));
  const result=await response.json();
  assert.equal(result.decision,'clarify');assert.equal(result.task,null);
});

test('Paint drawing is a new PNG task independent of the active table revision',()=>{
 const task={kind:'draw_window_in_paint',folder:'Rysunki',file_name:'okno-test.png',width_mm:1500,height_mm:1400,construction:'double_fixed',frame_color:'antracyt'};
 const result=planner.desktopPlan({decision:'execute',reply:'Plan',task},current,planner.DESKTOP_CAPABILITIES);
 assert.deepEqual(result.task,task);assert.equal(result.expectedRevision,null);assert.match(result.reply,/PNG/);
 assert.throws(()=>planner.desktopPlan({decision:'execute',reply:'Plan',task},current,['create_window_table','update_window_width']));
 for(const bad of [{...task,file_name:'x.exe'},{...task,construction:'hst'},{...task,frame_color:'RAL9007'},{...task,width_mm:100},{...task,command:'arbitrary'}])assert.throws(()=>planner.desktopPlan({decision:'execute',reply:'Plan',task:bad},current));
 assert.match(planner.unresolvedDimensionQuestion('Narysuj 150 na 140',[],task),/centymetrach/);
});

test('route preserves the declared Paint parameters and returns no table revision',async()=>{
 process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-unit-test-key';
 const task={kind:'draw_window_in_paint',folder:'Rysunki',file_name:'okno-test.png',width_mm:1500,height_mm:1400,construction:'double_fixed',frame_color:'antracyt'};
 output={decision:'execute',reply:'Plan schematu',task};
 const response=await route.POST(request({message:'Narysuj w Paint okno 1500 x 1400 mm, dwa skrzydła ze stałym słupkiem, antracyt.',history:[],currentTable:current,capabilities:planner.DESKTOP_CAPABILITIES,tables:[],reports:[]}));
 const result=await response.json();assert.equal(response.status,200);assert.deepEqual(result.task,task);assert.equal(result.expectedRevision,null);
});

test('diagnostics are independent of the active table and cannot specify commands',()=>{
 const task={kind:'inspect_computer',folder:'Diagnostyka',file_name:'raport.json'};
 const result=planner.desktopPlan({decision:'execute',reply:'Plan',task},current,planner.DESKTOP_CAPABILITIES);assert.equal(result.expectedRevision,null);assert.deepEqual(result.task,task);
 assert.throws(()=>planner.desktopPlan({decision:'execute',reply:'Plan',task:{...task,command:'anything'}},current));
 assert.throws(()=>planner.desktopPlan({decision:'execute',reply:'Plan',task:{...task,file_name:'x.exe'}},current));
});

test('complete specification uses independent text document and root alias, not a table revision', () => {
  const content='Specyfikacja\nA: DL, trzy szyby, kod TEST-701605, zamek i elektrozaczep.\nListwa transportowa opcjonalna 30 mm poza wysokością.\n';
  const task={kind:'save_offer_specification',folder:'NaviMind-Praca',file_name:'Specyfikacja testowa.txt',content};
  const plan=planner.desktopPlan({decision:'execute',reply:'Plan zapisu',task},current);
  assert.equal(plan.task.folder,null);assert.equal(plan.task.content,content);assert.equal(plan.expectedRevision,null);
  assert.throws(()=>planner.desktopPlan({reply:'Plan',task},null,['create_window_table']));
  assert.throws(()=>planner.desktopPlan({reply:'Plan',task:{...task,folder:'../escape'}},null));
  assert.throws(()=>planner.desktopPlan({reply:'Plan',task:{...task,content:'bad\u0000text'}},null));
});

test('desktop context retains lengthy PDF equipment while ordinary chat limits stay unchanged', async () => {
  process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='test-only';
  const history=[{role:'assistant',content:'Źródłowa specyfikacja i wyposażenie. '.repeat(350)}];
  assert.throws(()=>workspace.workspaceMessages({message:'Zapisz specyfikację',history}));
  assert.equal(workspace.workspaceMessages({message:'Zapisz specyfikację',history},48000)[0].content,history[0].content);
  output={decision:'execute',reply:'Plan zapisu',task:{kind:'save_offer_specification',folder:null,file_name:'Specyfikacja.txt',content:'Pełny tekst testowy\n'}};
  const response=await route.POST(request({message:'Zapisz pełną specyfikację z wyposażeniem',history,currentTable:null,capabilities:planner.DESKTOP_CAPABILITIES}));
  assert.equal(response.status,200);assert.equal((await response.json()).task.kind,'save_offer_specification');
});

test('full equipment save cannot be reported as a truncated dimension table', async () => {
  process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='test-only';
  queuedOutputs=[{decision:'execute',reply:'Plan',task:{kind:'create_window_table',folder:'Test',rows:[row]}},{decision:'execute',reply:'Plan',task:{kind:'save_offer_specification',folder:null,file_name:'Specyfikacja.txt',content:'Pełna treść z wyposażeniem.\n'}}];
  const response=await route.POST(request({message:'Zapisz pełną specyfikację z wyposażeniem',capabilities:planner.DESKTOP_CAPABILITIES}));
  assert.equal((await response.json()).task.kind,'save_offer_specification');queuedOutputs=null;
});
