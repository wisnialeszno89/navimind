const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(relative,mocks={}){const filename=path.resolve(__dirname,'..',relative),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));const require=m.require.bind(m);m.require=n=>Object.hasOwn(mocks,n)?mocks[n]:require(n);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);return m.exports;}
const images=load('app/lib/workspace-image.ts'),lib=load('app/lib/native-plan.ts',{'./workspace-image':images}),workspace=load('app/lib/workspace.ts');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=';
const snapshot={revision:'a'.repeat(64),image:png,width:1,height:1,title:'sesja-test.png - Paint',scope:'owned_paint_window'};
let replies=[],calls=0,last;
class OpenAI{chat={completions:{create:async input=>{calls++;last=input;return {choices:[{message:{content:JSON.stringify(replies.shift())}}]};}}};}
const route=load('app/api/workspace/native-plan/route.ts',{'@/lib/workspace':workspace,'@/lib/workspace-image':images,'@/lib/native-plan':lib,openai:OpenAI,'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{status:init.status||200})}}});
const request=(s=snapshot)=>new Request('https://test/api',{method:'POST',body:JSON.stringify({message:'Kliknij punkt 0,0 w syntetycznym obrazie.',snapshot:s,steps:[],history:[]})});
test('native snapshot requires an embedded PNG of the declared size',()=>{assert.deepEqual(lib.nativeSnapshot(snapshot),snapshot);for(const s of [{...snapshot,width:2},{...snapshot,image:'https://external.example/a.png'},{...snapshot,scope:'whole_desktop'},{...snapshot,cookies:'secret'}])assert.throws(()=>lib.nativeSnapshot(s));});
test('native actions stay inside the image and cannot run arbitrary commands',()=>{
 assert.equal(lib.nativeDecision({decision:'act',reply:'Krok',task:{kind:'native_click',x:0,y:0}},snapshot).expectedRevision,snapshot.revision);
 for(const task of [{kind:'native_click',x:1,y:0},{kind:'native_drag',points:[{x:0,y:0}]},{kind:'native_key',key:'WIN+R'},{kind:'shell',command:'anything'},{kind:'native_text',text:'\0'}])assert.throws(()=>lib.nativeDecision({decision:'act',reply:'Krok',task},snapshot));
 assert.equal(lib.nativeDecision({decision:'done',reply:'Widzę wynik',task:null},snapshot).task,null);
});
test('private route validates before provider and actually supplies image input',async()=>{
 process.env.NAVIMIND_WORKSPACE_MODE='public';assert.equal((await route.POST(request())).status,403);
 process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-test-key';const before=calls;
 assert.equal((await route.POST(request({...snapshot,width:2}))).status,400);assert.equal(calls,before);
 replies=[{decision:'act',reply:'Krok',task:{kind:'native_click',x:0,y:0}}];const response=await route.POST(request());assert.equal(response.status,200);assert.equal(last.messages.at(-1).content[1].image_url.url,png);
 replies=[{decision:'act',reply:'Krok',task:{kind:'native_key',key:'WIN+R'}},{decision:'review',reply:'Potrzebna pomoc',task:null}];const result=await (await route.POST(request())).json();assert.equal(result.task,null);assert.equal(result.decision,'review');
});

test('named controls bind the proposal to the current observed reference',()=>{
 const view={...snapshot,controls:[{ref:'e'+'a'.repeat(16),name:'Linia',x:0,y:0}]};
 assert.deepEqual(lib.nativeSnapshot(view),view);
 assert.deepEqual(lib.nativeDecision({decision:'act',reply:'Krok',task:{kind:'native_click',x:0,y:0}},view).task,{kind:'native_target',ref:view.controls[0].ref});
 assert.equal(lib.nativeDecision({decision:'act',reply:'Wybieram Linię',task:{kind:'native_target',ref:view.controls[0].ref}},view).task.ref,view.controls[0].ref);
 assert.throws(()=>lib.nativeDecision({decision:'act',reply:'Krok',task:{kind:'native_target',ref:'e'+'b'.repeat(16)}},view));
 assert.throws(()=>lib.nativeSnapshot({...view,controls:[{...view.controls[0],x:1}]}));
});
