// Real model, synthetic state transitions. Not a real-browser execution test.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module'),ts=require('typescript');
(async()=>{
 if(!process.env.VERCEL){console.log('BROWSER_MODEL_LOOP=skipped_local');return;}
 if(!process.env.OPENAI_API_KEY)throw Error('BROWSER_MODEL_LOOP_MISSING_CONFIGURATION');
 const model=process.env.NAVIMIND_WORKSPACE_MODEL||'gpt-4.1-mini';
 const files=['app/api/workspace/browser-plan/route.ts','app/lib/browser-plan.ts','app/lib/browser-step-receipt.ts','app/components/WorkspaceChat.tsx',__filename];
 const hash=crypto.createHash('sha256').update(model);for(const file of files)hash.update(fs.readFileSync(file));
 const cache=path.join('.next/cache/navimind-browser-loop',hash.digest('hex')+'.json');let previous;try{previous=JSON.parse(fs.readFileSync(cache));}catch{}
 if(previous?.passed&&Date.now()-Date.parse(previous.checked_at)<86400000){console.log('BROWSER_MODEL_LOOP=verified_cached');return;}
 const file=path.resolve('app/lib/browser-step-receipt.ts'),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
 const {browserStepReceipt}=m.exports;
 process.env.NAVIMIND_WORKSPACE_MODE='private';
 const route=require('../.next/server/app/api/workspace/browser-plan/route.js').routeModule.userland;
 const state={search:'',customer:'',width:'',height:'',color:'',opening:'',preview:''};
 const names={search:'Wyszukaj klienta',width:'Szerokość [mm]',height:'Wysokość [mm]',color:'Kolor zewnętrzny',opening:'Otwieranie'};
 const options={color:[{label:'Wybierz kolor',value:''},{label:'Biały',value:'bialy'},{label:'Antracyt',value:'antracyt'},{label:'Mahoń',value:'mahon'}],opening:[{label:'Wybierz okucie',value:''},{label:'DKL',value:'DKL'},{label:'DKR',value:'DKR'}]};
 function snapshot(){
  const controls=[];
  function add(name,tag,type,value='',extra={}){controls.push({ref:'e'+crypto.randomBytes(8).toString('hex'),tag,role:'',type,name,href:'',disabled:false,checked:false,value_present:!!value,submits_form:false,...extra});}
  add(names.search,'input','search',state.search);
  if(state.search&&!state.customer)for(const name of ['Top Trans S.A.','Top Trans'])add(name,'button','button');
  add(names.width,'input','number',state.width);add(names.height,'input','number',state.height);
  add(names.color,'select','select-one',state.color,{options:options.color});add(names.opening,'select','select-one',state.opening,{options:options.opening});add('Pokaż podgląd','button','button');
  return {revision:crypto.randomBytes(32).toString('hex'),url:'about:blank',title:'NaviMind — laboratorium przeglądarki',scope:'owned_chromium_tab',controls,text:'Klient i okno\n'+(state.customer?'Wybrany klient: '+state.customer:'Nie wybrano klienta.')+'\nWyszukaj klienta\nSzerokość [mm]\nWysokość [mm]\nKolor zewnętrzny Wybierz kolor Biały Antracyt Mahoń\nOtwieranie Wybierz okucie DKL DKR\nPokaż podgląd\n'+state.preview};
 }
 function apply(task,before){
  const c=before.controls.find(c=>c.ref===task.ref);if(!c)throw Error('UNKNOWN_SYNTHETIC_TARGET');
  if(task.kind==='browser_fill'||task.kind==='browser_select'){
   const key=Object.keys(names).find(key=>names[key]===c.name);if(!key)throw Error('UNKNOWN_SYNTHETIC_FIELD');
   state[key]=task.text??task.value;state.preview='';
  }else if(task.kind==='browser_click'&&['Top Trans','Top Trans S.A.'].includes(c.name)){state.customer=c.name;state.preview='';}
  else if(task.kind==='browser_click'&&c.name==='Pokaż podgląd')state.preview=state.customer&&state.width&&state.height&&state.color&&state.opening?`PODGLĄD GOTOWY\nKlient: ${state.customer}\nSzerokość: ${state.width} mm\nWysokość: ${state.height} mm\nKolor: ${state.color}\nOkucie: ${state.opening}`:'Uzupełnij klienta, wymiary, kolor i okucie.';
  else throw Error('UNSUPPORTED_SYNTHETIC_ACTION');
 }
 async function run(phase,message,history=[]){
  const steps=[JSON.stringify({observed_url:'about:blank',source:'initial_observation'})];
  for(let i=0;i<12;i++){
   const before=snapshot();
   const response=await route.POST(new Request('https://fixture.invalid/api/workspace/browser-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history,snapshot:before,steps})}));
   const plan=await response.json();if(response.status!==200)throw Error('BROWSER_MODEL_LOOP_REQUEST_FAILED '+phase);
   if(plan.decision==='done'){
    if(state.customer!=='Top Trans'||state.width!==(phase==='initial'?'1100':'1230')||state.height!=='1000'||state.color!=='antracyt'||state.opening!=='DKR'||!state.preview.includes('Szerokość: '+state.width+' mm'))throw Error('BROWSER_MODEL_LOOP_FALSE_SUCCESS '+phase);
    console.log('BROWSER_MODEL_PHASE=verified PHASE='+phase+' CALLS='+(i+1));return plan.reply;
   }
   if(!plan.task)throw Error('BROWSER_MODEL_LOOP_STOPPED '+phase+' '+plan.decision);
   apply(plan.task,before);const after=snapshot();
   steps.push(browserStepReceipt(before,plan.task,{status:'verified',message:plan.task.kind==='browser_click'?'Kliknięto element i odczytano nowy widok.':'Sprawdzono wpisaną lub wybraną wartość pola.',browser:after}));
  }
  throw Error('BROWSER_MODEL_LOOP_BUDGET '+phase);
 }
 const first='Wybierz dokładnie Top Trans. Ustaw szerokość 1100 mm, wysokość 1000 mm, kolor antracyt i otwieranie DKR. Pokaż podgląd. Nie wysyłaj zapytania.';
 const reply=await run('initial',first);
 await run('correction','Zmień wyłącznie szerokość na 1230 mm. Zachowaj pozostałe ustawienia i pokaż ponownie podgląd.',[{role:'user',content:first},{role:'assistant',content:reply}]);
 fs.mkdirSync(path.dirname(cache),{recursive:true});fs.writeFileSync(cache,JSON.stringify({passed:true,model,checked_at:new Date().toISOString()}));
 console.log('BROWSER_MODEL_LOOP=verified PHASES=2 REAL_MODEL=True SYNTHETIC_BROWSER=True');
})().catch(problem=>{console.error(String(problem.message).slice(0,500));process.exitCode=1;});
