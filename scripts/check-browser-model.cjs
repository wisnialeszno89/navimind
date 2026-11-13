// Real configured model + synthetic browser transitions. No desktop execution.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module'),ts=require('typescript');
const fixturePath='contracts/browser-regression-v1.json';
const suite=JSON.parse(fs.readFileSync(fixturePath));
const fixtureHash=crypto.createHash('sha256').update(fs.readFileSync(fixturePath)).digest('hex');
const {createBrowserEval}=require('./browser-eval-environment.cjs');
const fields=['customer','width','height','color','opening'];
(async()=>{
 if(!process.env.VERCEL){console.log('BROWSER_MODEL_LOOP=skipped_local');return;}
 if(!process.env.OPENAI_API_KEY)throw Error('BROWSER_MODEL_LOOP_MISSING_CONFIGURATION');
 const model=process.env.NAVIMIND_BROWSER_MODEL||'gpt-5.4';
 const files=['app/lib/browser-model.ts','app/api/workspace/browser-plan/route.ts','app/lib/browser-plan.ts','app/lib/browser-step-receipt.ts','app/components/WorkspaceChat.tsx',fixturePath,'scripts/browser-eval-environment.cjs',__filename];
 const hash=crypto.createHash('sha256').update(model);for(const file of files)hash.update(fs.readFileSync(file));
 const cache=path.join('.next/cache/navimind-browser-loop',hash.digest('hex')+'.json');let previous;try{previous=JSON.parse(fs.readFileSync(cache));}catch{}
 if(previous?.passed&&Date.now()-Date.parse(previous.checked_at)<86400000){console.log('BROWSER_MODEL_LOOP=verified_cached FIXTURE_SHA256='+fixtureHash);return;}
 const file=path.resolve('app/lib/browser-step-receipt.ts'),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
 const {browserStepReceipt}=m.exports;
 process.env.NAVIMIND_WORKSPACE_MODE='private';
 const route=require('../.next/server/app/api/workspace/browser-plan/route.js').routeModule.userland;
 const reports=[];
 for(const scenario of suite.scenarios){
  const {state,snapshot,apply,summary}=createBrowserEval(scenario.seed);
  const history=[];
  for(const phase of scenario.phases){
   const id=scenario.id+'/'+phase.id,start={...state},steps=[JSON.stringify({observed_url:'about:blank',source:'initial_observation'})],noEffect=new Map();let finished=false;
   for(let i=0;i<12;i++){
    const before=snapshot();
    const response=await route.POST(new Request('https://fixture.invalid/api/workspace/browser-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:phase.message,history,snapshot:before,steps})}));
    const plan=await response.json();if(response.status!==200)throw Error('MODEL_REQUEST_FAILED '+id);
    if(!plan.task){
     if(!phase.terminal_decisions.includes(plan.decision))throw Error('WRONG_TERMINAL '+id+' '+plan.decision+' '+String(plan.reply).slice(0,250));
     if(phase.required_reply_terms?.some(term=>!plan.reply.toLowerCase().includes(term.toLowerCase()))||phase.reply_pattern&&!new RegExp(phase.reply_pattern,'i').test(plan.reply))throw Error('UNGROUNDED_QUESTION '+id);
     for(const key of fields)if(!phase.allowed_write_fields.includes(key)&&state[key]!==start[key])throw Error('PRESERVED_FIELD_CHANGED '+id+' '+key);
     if(phase.expected){for(const key of fields)if(state[key]!==phase.expected[key])throw Error('FALSE_SUCCESS '+id+' '+key);if(state.preview!==summary())throw Error('PREVIEW_NOT_REFRESHED '+id);}
     reports.push({id,decision:plan.decision,calls:i+1,status:'passed'});
     console.log('BROWSER_MODEL_PHASE=verified CASE='+id+' DECISION='+plan.decision+' CALLS='+(i+1));
     history.push({role:'user',content:phase.message},{role:'assistant',content:plan.reply});finished=true;break;
    }
    const target=before.controls.find(c=>c.ref===plan.task.ref)?.name||plan.task.kind;
    const key=JSON.stringify([state,plan.task.kind,target]);if((noEffect.get(key)||0)>=2)throw Error('NO_EFFECT_LOOP '+id);
    const prior=JSON.stringify(state);apply(plan.task,before,phase);if(JSON.stringify(state)===prior)noEffect.set(key,(noEffect.get(key)||0)+1);
    console.log('BROWSER_MODEL_STEP CASE='+id+' KIND='+plan.task.kind+' TARGET='+target);
    steps.push(browserStepReceipt(before,plan.task,{status:'verified',message:plan.task.kind==='browser_click'?'Kliknięto element i odczytano nowy widok.':'Sprawdzono wpisaną lub wybraną wartość pola.',browser:snapshot()}));
   }
   if(!finished)throw Error('MODEL_STEP_BUDGET '+id);
  }
 }
 fs.mkdirSync(path.dirname(cache),{recursive:true});fs.writeFileSync(cache,JSON.stringify({passed:true,model,fixture_sha256:fixtureHash,checked_at:new Date().toISOString(),reports}));
 console.log('BROWSER_MODEL_LOOP=verified PHASES='+reports.length+' REAL_MODEL=True SYNTHETIC_BROWSER=True FIXTURE_SHA256='+fixtureHash);
})().catch(problem=>{console.error(String(problem.message).slice(0,500));process.exitCode=1;});
