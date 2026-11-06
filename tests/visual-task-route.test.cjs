const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
function load(relative,stubs={}){const file=path.resolve(__dirname,'..',relative);const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const original=m.require.bind(m);m.require=(id)=>Object.hasOwn(stubs,id)?stubs[id]:original(id);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);return m.exports}
const contract=load('app/lib/agent/visualTaskContract.ts');
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7WQAAAAASUVORK5CYII=';
const request=()=>({version:'visual-1',task_id:'test-image',turn:0,goal:'Read this synthetic test image',screen:{image_data_url:image,width:1,height:1},feedback:[]});
const action=(kind,extras={})=>({kind,x:null,y:null,width:null,height:null,text:null,key:null,direction:null,amount:null,reason:'Synthetic test action',...extras});
test('accepts PNG image with exact dimensions, rejects remote URL and mismatched dimensions',()=>{contract.validateVisualRequest(request());for(const screen of [{image_data_url:'https://example.com/screen.png',width:1,height:1},{image_data_url:image,width:2,height:1}])assert.throws(()=>contract.validateVisualRequest({...request(),screen}))});
test('rejects coordinates outside screenshot and arbitrary keyboard shortcuts',()=>{assert.throws(()=>contract.validateVisualAction(action('click',{x:1,y:0}),1,1));assert.throws(()=>contract.validateVisualAction(action('key',{key:'CTRL+S'}),1,1));contract.validateVisualAction(action('key',{key:'CTRL+A'}),1,1)});
test('unused action fields cannot hide additional instructions',()=>{assert.throws(()=>contract.validateVisualAction(action('done',{text:'execute code'}),1,1))});
test('reasoner sends image as image content, not text OCR',async()=>{let sent;class FakeOpenAI{constructor(){this.chat={completions:{create:async args=>{sent=args;return {choices:[{message:{content:JSON.stringify(action('inspect'))}}]}}}}}}const reasoner=load('app/lib/agent/reasonVisualTask.ts',{'./visualTaskContract':contract,'openai':FakeOpenAI});const result=await reasoner.reasonVisualTask(request());assert.equal(result.task_id,'test-image');assert.equal(sent.messages[1].content[1].type,'image_url');assert.equal(sent.messages[1].content[1].image_url.url,image);assert.equal(sent.store,false);assert.match(sent.messages[0].content,/actual field/)});
function route(){return load('app/api/agent/visual-task/route.ts',{'next/server':{NextResponse:{json:(body,init)=>new Response(JSON.stringify(body),{status:init?.status||200})}},'@/lib/agent/visualTaskContract':contract,'@/lib/agent/reasonVisualTask':{reasonVisualTask:async task=>({version:task.version,task_id:task.task_id,turn:task.turn,action:action('inspect')})}})}
async function environment(fn){const before={...process.env};process.env.NAVIMIND_VISUAL_ENABLED='1';process.env.NAVIMIND_AGENT_SECRET='synthetic-test-secret';process.env.OPENAI_API_KEY='synthetic-provider-key';try{await fn()}finally{for(const k of ['NAVIMIND_VISUAL_ENABLED','NAVIMIND_AGENT_SECRET','OPENAI_API_KEY'])before[k]===undefined?delete process.env[k]:process.env[k]=before[k]}}
function http(body=request(),secret='synthetic-test-secret'){return new Request('http://localhost/api/agent/visual-task',{method:'POST',headers:{'content-type':'application/json','x-navimind-agent-secret':secret},body:JSON.stringify(body)})}
test('endpoint is disabled by default',()=>environment(async()=>{delete process.env.NAVIMIND_VISUAL_ENABLED;assert.equal((await route().POST(http())).status,503)}));
test('endpoint authenticates and validates before invoking reasoner',()=>environment(async()=>{assert.equal((await route().POST(http(request(),'wrong'))).status,401);assert.equal((await route().POST(http({...request(),hwnd:123}))).status,400);const response=await route().POST(http());assert.equal(response.status,200);assert.equal((await response.json()).action.kind,'inspect')}));
test('endpoint bounds image body without revealing provider details',()=>environment(async()=>{const response=await route().POST(http({...request(),goal:'x'.repeat(contract.VISUAL_BODY_LIMIT+1)}));assert.equal(response.status,413);assert.deepEqual(await response.json(),{error:'PAYLOAD_TOO_LARGE'})}));

test('provider failures expose only fixed categories, never provider details',()=>{
  const r=load('app/lib/agent/reasonVisualTask.ts',{'./visualTaskContract':contract,'openai':class {}});
  for(const [status,code] of [[400,'VISUAL_PROVIDER_REQUEST_REJECTED'],[401,'VISUAL_PROVIDER_AUTH_REJECTED'],[404,'VISUAL_PROVIDER_MODEL_UNAVAILABLE'],[429,'VISUAL_PROVIDER_QUOTA_OR_RATE_LIMIT'],[503,'VISUAL_PROVIDER_UNAVAILABLE']]){
    assert.equal(r.safeVisualFailure({status,message:'sensitive payload',body:{secret:'do not expose'}}),code);
  }
  assert.equal(r.safeVisualFailure(new Error('private provider response')),'VISUAL_TASK_FAILED');
});
test('model output failures distinguish truncation, refusal, JSON and action validation',async()=>{
  for(const [choice,expected] of [
    [{finish_reason:'length',message:{content:'{'}},'VISUAL_MODEL_OUTPUT_TRUNCATED'],
    [{message:{refusal:'private text'}},'VISUAL_MODEL_REFUSAL'],
    [{message:{content:null}},'VISUAL_MODEL_EMPTY_OUTPUT'],
    [{message:{content:'not-json'}},'VISUAL_MODEL_INVALID_JSON'],
    [{message:{content:JSON.stringify(action('click',{x:99,y:0}))}},'VISUAL_MODEL_INVALID_ACTION']
  ]){
    class FakeOpenAI{constructor(){this.chat={completions:{create:async()=>({choices:[choice]})}}}}
    const r=load('app/lib/agent/reasonVisualTask.ts',{'./visualTaskContract':contract,'openai':FakeOpenAI});
    await assert.rejects(r.reasonVisualTask(request()),new RegExp('^Error: '+expected+'$'));
  }
});
test('route returns safe failure code without logging screenshot or provider body',()=>environment(async()=>{
  const r=load('app/lib/agent/reasonVisualTask.ts',{'./visualTaskContract':contract,'openai':class {}});
  const api=load('app/api/agent/visual-task/route.ts',{'next/server':{NextResponse:{json:(body,init)=>new Response(JSON.stringify(body),{status:init?.status||200})}},'@/lib/agent/visualTaskContract':contract,'@/lib/agent/reasonVisualTask':{safeVisualFailure:r.safeVisualFailure,reasonVisualTask:async()=>{throw {status:429,message:'private provider body'}}}});
  const before=console.warn;const logs=[];console.warn=(line)=>logs.push(line);
  try{const response=await api.POST(http());assert.equal(response.status,502);assert.deepEqual(await response.json(),{error:'VISUAL_PROVIDER_QUOTA_OR_RATE_LIMIT'});assert.deepEqual(logs,['VISUAL_FAILURE=VISUAL_PROVIDER_QUOTA_OR_RATE_LIMIT'])}finally{console.warn=before}
}));
