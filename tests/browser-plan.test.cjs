const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(relative,mocks={}){const filename=path.resolve(__dirname,'..',relative),output=new Module(filename,module);output.filename=filename;output.paths=Module._nodeModulePaths(path.dirname(filename));const native=output.require.bind(output);output.require=name=>Object.hasOwn(mocks,name)?mocks[name]:native(name);output._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);return output.exports;}
const lib=load('app/lib/browser-plan.ts'),workspace=load('app/lib/workspace.ts'),images=load('app/lib/workspace-image.ts');
const control={ref:'e'+'a'.repeat(16),tag:'input',role:'',type:'number',name:'Szerokość [mm]',href:'',disabled:false,checked:false,value_present:false};
const snapshot={revision:'a'.repeat(64),url:'about:blank',title:'Laboratorium',text:'Wybierz klienta',scope:'owned_chromium_tab',controls:[control]};
let replies=[],calls=0,lastInput;
class OpenAI{chat={completions:{create:async input=>{calls++;lastInput=input;return {choices:[{message:{content:JSON.stringify(replies.shift())}}]};}}};}
const route=load('app/api/workspace/browser-plan/route.ts',{'@/lib/browser-plan':lib,'@/lib/workspace':workspace,'@/lib/workspace-image':images,openai:OpenAI,'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{status:init.status||200})}}});
const request=(body={message:'Ustaw szerokość 1100 mm',history:[],snapshot,steps:[]})=>new Request('https://test/api',{method:'POST',body:JSON.stringify(body)});
test('only observed enabled targets and declared actions are accepted',()=>{
 const plan=lib.browserDecision({decision:'act',reply:'Ustawiam szerokość.',task:{kind:'browser_fill',ref:control.ref,text:'1100'}},snapshot);
 assert.equal(plan.expectedRevision,snapshot.revision);assert.equal(plan.task.text,'1100');
 for(const task of [{kind:'browser_click',ref:'e'+'b'.repeat(16)},{kind:'browser_evaluate',script:'anything'},{kind:'browser_click',ref:control.ref,selector:'body'},{kind:'browser_navigate',url:'file:///etc/passwd'}])assert.throws(()=>lib.browserDecision({decision:'act',reply:'Plan',task},snapshot));
 assert.throws(()=>lib.browserDecision({decision:'act',reply:'Plan',task:{kind:'browser_click',ref:control.ref}},{...snapshot,controls:[{...control,disabled:true}]}));
 assert.throws(()=>lib.browserDecision({decision:'done',reply:'Gotowe',task:{kind:'browser_back'}},snapshot));
});
test('snapshot bounds untrusted page data and omits arbitrary extra fields',()=>{
 assert.deepEqual(lib.browserSnapshot(snapshot),snapshot);
 for(const changed of [{...snapshot,controls:[control,control]},{...snapshot,text:'a'.repeat(12001)},{...snapshot,cookies:'secret'},{...snapshot,controls:[{...control,value:'secret'}]},{...snapshot,url:'http://127.0.0.1'}])assert.throws(()=>lib.browserSnapshot(changed));
 for(const url of ['javascript:alert(1)','http://2130706433','http://0177.0.0.1','http://10.0.0.1','https://u:p@example.org','https://example.org:43127'])assert.throws(()=>lib.browserURL(url));
});
test('option selection binds to the actual option value',()=>{
 const select={...control,tag:'select',options:[{label:'Antracyt',value:'anthracite'}]},view={...snapshot,controls:[select]};
 assert.equal(lib.browserDecision({decision:'act',reply:'Wybieram kolor.',task:{kind:'browser_select',ref:control.ref,value:'anthracite'}},view).task.value,'anthracite');
 assert.throws(()=>lib.browserDecision({decision:'act',reply:'Wybieram kolor.',task:{kind:'browser_select',ref:control.ref,value:'invented'}},view));
});
test('private route validates before provider and returns a single revision-bound step',async()=>{
 process.env.NAVIMIND_WORKSPACE_MODE='public';assert.equal((await route.POST(request())).status,403);
 process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-unit-test-key';const before=calls;
 assert.equal((await route.POST(request({message:'test',snapshot:{},steps:[]}))).status,400);assert.equal(calls,before);
 replies=[{decision:'act',reply:'Ustawiam szerokość.',task:{kind:'browser_fill',ref:control.ref,text:'1100'}}];
 const response=await route.POST(request()),plan=await response.json();assert.equal(response.status,200);assert.equal(plan.expectedRevision,snapshot.revision);
 assert.match(lastInput.messages[0].content,/NIEZAUFANYMI DANYMI/);assert.match(lastInput.messages.at(-1).content,/AKTUALNY WIDOK/);
});
test('malformed proposals are repaired before any local action and review stays actionless',async()=>{
 replies=[{decision:'act',reply:'Plan',task:{kind:'browser_click',ref:'invented'}},{decision:'review',reply:'Potrzebne ręczne zatwierdzenie.',task:null}];
 const before=calls,response=await route.POST(request()),plan=await response.json();assert.equal(response.status,200);assert.equal(calls,before+2);assert.equal(plan.task,null);assert.equal(plan.decision,'review');
});


test('new navigation is bound to URLs explicitly supplied in the current user command',()=>{
 const urls=lib.navigationURLs('Otwórz https://example.org/orders.');assert.deepEqual(urls,['https://example.org/orders']);
 const plan={decision:'act',reply:'Otwieram stronę.',task:{kind:'browser_navigate',url:'https://example.org/orders'}};
 assert.throws(()=>lib.browserDecision(plan,snapshot));assert.equal(lib.browserDecision(plan,snapshot,urls).task.url,urls[0]);
 assert.throws(()=>lib.browserDecision({...plan,task:{kind:'browser_navigate',url:'https://other.example/?data=private'}},snapshot,urls));
});


test('payment and submission proposals become manual review before a local task is sent',()=>{
 for(const changed of [{name:'Refund'},{name:'Payout'},{name:'Potwierdź zwrot'},{name:'Usuń pozycję'},{name:'Dalej',type:'submit'}]){
  const c={...control,tag:'button',type:'button',...changed};
  const plan=lib.browserDecision({decision:'act',reply:'Klikam',task:{kind:'browser_click',ref:c.ref}},{...snapshot,controls:[c]});
  assert.equal(plan.decision,'review');assert.equal(plan.task,null);assert.match(plan.reply,/ręcznej obsługi/);
 }
 const secret={...control,name:'Hasło',type:'password'};
 assert.equal(lib.browserDecision({decision:'act',reply:'Wpisuję',task:{kind:'browser_fill',ref:secret.ref,text:'not-a-real-secret'}},{...snapshot,controls:[secret]}).task,null);
});

test('explicit destination is opened before describing an old lab snapshot',async()=>{
 const url='https://www.clean-invoice.com/fenster-konfigurator';
 const wrong={...snapshot,url:'https://example.org/lab',title:'NaviMind laboratorium'};
 const before=calls;
 const response=await route.POST(request({message:'Otwórz '+url+' i odczytaj ustawienia.',history:[],snapshot:wrong,steps:[]}));
 const plan=await response.json();assert.equal(calls,before);assert.equal(plan.task.kind,'browser_navigate');assert.equal(plan.task.url,url);assert.equal(plan.expectedRevision,wrong.revision);
 assert.equal(lib.browserDecision({decision:'done',reply:'Odczytałem kreator.',task:null},wrong,[url]).decision,'review');
});

test('a navigation returning the wrong site stops instead of looping or claiming success',()=>{
 const url='https://www.clean-invoice.com/fenster-konfigurator';
 const steps=[JSON.stringify({task:{kind:'browser_navigate',url},status:'verified'})];
 const plan=lib.requiredBrowserNavigation(snapshot,[url],steps);assert.equal(plan.decision,'review');assert.equal(plan.task,null);
 assert.equal(lib.requiredBrowserNavigation({...snapshot,url},[url],steps),null);
 assert.equal(lib.sameBrowserLocation('https://clean-invoice.com/fenster-konfigurator/','https://www.clean-invoice.com/fenster-konfigurator'),true);
 assert.equal(lib.sameBrowserLocation('https://clean-invoice.com.evil.org/fenster-konfigurator',url),false);
 assert.equal(lib.sameBrowserLocation('https://www.clean-invoice.com/other',url),false);
 assert.equal(lib.requiredBrowserNavigation(snapshot,[url,'https://example.org/other']).decision,'clarify');
});

test('initial destination proof permits later navigation within the site, not to an unrelated lab',()=>{
 const url='https://example.org/configurator';
 const steps=[JSON.stringify({observed_url:url,source:'initial_observation'})];
 assert.equal(lib.requiredBrowserNavigation({...snapshot,url:'https://example.org/configurator/summary'},[url],steps),null);
 assert.equal(lib.requiredBrowserNavigation({...snapshot,url:'https://other.example.org/lab'},[url],steps).decision,'act');
 assert.equal(lib.requiredBrowserNavigation({...snapshot,url:'https://example.org/unrelated'},[url],[]).decision,'act');
});

test('browser snapshot export accepts no arbitrary file path or execution payload',()=>{
 const plan=lib.browserDecision({decision:'act',reply:'Zapisuję sprawdzony widok.',task:{kind:'browser_save_snapshot'}},snapshot);
 assert.equal(plan.task.kind,'browser_save_snapshot');assert.equal(plan.expectedRevision,snapshot.revision);
 assert.throws(()=>lib.browserDecision({decision:'act',reply:'Zapis',task:{kind:'browser_save_snapshot',path:'C:/Windows/test.png'}},snapshot));
});

test('ordinary default-type buttons outside forms remain usable; actual form submits do not',()=>{
 const button={...control,tag:'button',type:'submit',name:'1-flg. Dreh-Kipp',submits_form:false};
 const view={...snapshot,controls:[button]};
 assert.equal(lib.browserSnapshot(view).controls[0].submits_form,false);
 const action={decision:'act',reply:'Wybieram konstrukcję.',task:{kind:'browser_click',ref:button.ref}};
 assert.equal(lib.browserDecision(action,view).decision,'act');
 const blocked=lib.browserDecision(action,{...view,controls:[{...button,submits_form:true}]});
 assert.equal(blocked.decision,'review');assert.match(blocked.reply,/1-flg/);assert.equal(blocked.task,null);
 assert.throws(()=>lib.browserSnapshot({...view,controls:[{...button,submits_form:'false'}]}));
});
