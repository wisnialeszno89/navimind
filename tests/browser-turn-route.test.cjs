const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(relative,mocks={}){const file=path.resolve(__dirname,'..',relative),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const native=m.require.bind(m);m.require=name=>Object.hasOwn(mocks,name)?mocks[name]:native(name);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);return m.exports;}
const receipt=load('app/lib/browser-step-receipt.ts'),sessions=load('app/lib/browser-session.ts',{'./browser-step-receipt':receipt}),browser=load('app/lib/browser-plan.ts');
let response={intent:'reply',reply:'DKR to prawe okno rozwierno-uchylne.'},calls=0,last;
class OpenAI{chat={completions:{create:async input=>{calls++;last=input;return {choices:[{message:{content:JSON.stringify(response)}}]};}}};}
const route=load('app/api/workspace/browser-turn/route.ts',{'@/lib/browser-model':{browserModel:()=> 'synthetic-browser-model'},'@/lib/browser-plan':browser,'@/lib/browser-session':sessions,'@/lib/workspace':load('app/lib/workspace.ts'),'@/lib/workspace-image':load('app/lib/workspace-image.ts'),openai:OpenAI,'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{status:init.status||200})}}});
const req=body=>new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify(body)});
test('a conversation turn is authenticated, bounded, actionless and includes the original task context',async()=>{
 const body={message:'Co oznacza DKR?',history:[],session:sessions.newBrowserSession('session','Ustaw okno i pokaż podgląd.')};
 process.env.NAVIMIND_WORKSPACE_MODE='public';assert.equal((await route.POST(req(body))).status,403);
 process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-key';const before=calls;
 assert.equal((await route.POST(req({...body,session:{...body.session,token:'secret'}}))).status,400);assert.equal(calls,before);
 const result=await route.POST(req(body));assert.equal(result.status,200);assert.equal((await result.json()).intent,'reply');assert.equal(last.response_format.json_schema.strict,true);assert.ok(last.messages.at(-1).content.includes(body.session.goal));assert.ok(!last.messages.at(-1).content.includes('synthetic-key'));
});
test('an inspect response cannot authorize a task, even if the model returns start',async()=>{
 response={intent:'start',reply:'Rozpoczynam.'};
 const snapshot={revision:'a'.repeat(64),url:'about:blank',title:'Laboratorium',scope:'owned_chromium_tab',controls:[],text:'Widoczny formularz'};
 const result=await route.POST(req({message:'Co teraz widzisz?',history:[],session:null,snapshot}));const answer=await result.json();assert.equal(answer.intent,'reply');assert.equal(answer.task,undefined);
});
