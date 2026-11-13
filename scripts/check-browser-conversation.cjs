// Run the same orchestration engine as WorkspaceChat against built API routes.
// Model calls are real; browser transitions are synthetic and never reach a desktop.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module'),ts=require('typescript');
const {createBrowserEval}=require('./browser-eval-environment.cjs');
(async()=>{
 if(!process.env.VERCEL){console.log('BROWSER_CONVERSATION=skipped_local');return;}
 const files=['app/lib/browser-model.ts','app/api/workspace/browser-turn/route.ts','app/api/workspace/browser-plan/route.ts','app/lib/browser-session.ts','app/lib/browser-runner.ts','app/lib/browser-plan.ts','app/lib/browser-step-receipt.ts','app/components/WorkspaceChat.tsx','scripts/browser-eval-environment.cjs',__filename];
 const hash=crypto.createHash('sha256').update(process.env.NAVIMIND_BROWSER_MODEL||'gpt-5.4');for(const file of files)hash.update(fs.readFileSync(file));
 const cacheFile=path.join('.next/cache/navimind-browser-conversation',hash.digest('hex')+'.json');let previous;try{previous=JSON.parse(fs.readFileSync(cacheFile));}catch{}
 if(previous?.passed&&Date.now()-Date.parse(previous.checked_at)<86400000){console.log('BROWSER_CONVERSATION=verified_cached');return;}
 const modules={};function load(relative){if(modules[relative])return modules[relative];const file=path.resolve(relative),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const native=m.require.bind(m);m.require=name=>name.startsWith('.')?load(path.relative(process.cwd(),path.resolve(path.dirname(file),name+'.ts'))):native(name);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);return modules[relative]=m.exports;}
 const {runBrowserConversation}=load('app/lib/browser-runner.ts');
 process.env.NAVIMIND_WORKSPACE_MODE='private';
 const turnRoute=require('../.next/server/app/api/workspace/browser-turn/route.js').routeModule.userland;
 const planRoute=require('../.next/server/app/api/workspace/browser-plan/route.js').routeModule.userland;
 async function request(route,body){const r=await route.POST(new Request('https://fixture.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));if(!r.ok)throw Error('CONVERSATION_API_FAILED '+r.status);return r.json();}
 let environment=createBrowserEval(),session=null,last,phase,executions=0,observations=0,history=[];const reports=[];
 const ports={turn:body=>request(turnRoute,body),plan:body=>request(planRoute,body),observe:async()=>{observations++;return last=environment.snapshot();},execute:async body=>{executions++;environment.apply(body.task,last,phase);last=environment.snapshot();return {status:'verified',message:'Sprawdzono wykonanie kroku w syntetycznym formularzu.',browser:last};},changed:s=>{session=s;},progress:()=>{},stopped:()=>false,pending:()=>{},executed:()=>{},id:()=>crypto.randomUUID()};
 const base={customer:'Top Trans',width:'1100',height:'1200',color:'antracyt',opening:'DKR'};
 async function turn(id,message,{kind,expected=null,allowed=[],noActions=false,noRead=false,requiresRead=false,answerPattern=null}={}){
  phase={expected,allowed_write_fields:allowed};const beforeActions=executions,beforeReads=observations;
  // The active goal must survive even when ordinary history is outside its 12-message window.
  const outcome=await runBrowserConversation(message,history.slice(-12),session,ports);
  if(!kind.includes(outcome.kind))throw Error('CONVERSATION_WRONG_OUTCOME '+id+' '+outcome.kind+' '+outcome.reply.slice(0,220));
  if(noActions&&executions!==beforeActions||noRead&&observations!==beforeReads||requiresRead&&observations===beforeReads)throw Error('CONVERSATION_UNREQUESTED_ACTION '+id);
  if(expected){for(const key of Object.keys(expected))if(environment.state[key]!==expected[key])throw Error('CONVERSATION_WRONG_VALUE '+id+' '+key);if(environment.state.preview!==environment.summary())throw Error('CONVERSATION_FALSE_PREVIEW '+id);}
  if(answerPattern&&!new RegExp(answerPattern,'i').test(outcome.reply))throw Error('CONVERSATION_UNGROUNDED_ANSWER '+id+' '+outcome.reply.slice(0,280));
  history.push({role:'user',content:message},{role:'assistant',content:outcome.reply});reports.push({id,kind:outcome.kind,actions:executions-beforeActions,reads:observations-beforeReads});console.log('BROWSER_CONVERSATION_CASE=verified CASE='+id+' KIND='+outcome.kind+' ACTIONS='+(executions-beforeActions));return outcome;
 }
 const all=Object.keys(base),first='Wybierz dokładnie Top Trans. Szerokość 1100 mm, kolor antracyt, otwieranie DKR. Pokaż podgląd. Nie wysyłaj zapytania.';
 await turn('missing_height',first,{kind:['clarify'],allowed:['customer','width','color','opening'],answerPattern:'wysoko|höhe'});
 if(session.goal!==first||session.status!=='awaiting')throw Error('CONVERSATION_GOAL_NOT_RETAINED');
 await turn('discussion_during_question','Zanim odpowiem: wyjaśnij krótko, czym różni się DKR od DKL. Na razie niczego nie zmieniaj.',{kind:['reply'],noActions:true,noRead:true,answerPattern:'praw|lew'});
 if(session.goal!==first||session.status!=='awaiting')throw Error('CONVERSATION_DISCUSSION_LOST_GOAL');
 // Simulate a long discussion: goal and pending question live outside chat history.
 history=[];
 await turn('short_answer_resumes','Wysokość 1200 mm.',{kind:['done'],expected:base,allowed:all});
 if(session.goal!==first||session.status!=='completed')throw Error('CONVERSATION_RESUME_CHANGED_GOAL');
 const wide={...base,width:'1230'};
 await turn('correction_without_repeating_goal','A jednak szerokość 1230 mm. Resztę zostaw i odśwież podgląd.',{kind:['done'],expected:wide,allowed:['width']});
 environment.state.width='1277';environment.state.preview=environment.summary();
 await turn('inspect_without_clicking','Co teraz widzisz w podglądzie? Podaj szerokość i wysokość.',{kind:['reply'],noActions:true,requiresRead:true,answerPattern:'1277'});
 await turn('preserve_operator_edit','Zmień tylko otwieranie na DKL. Zachowaj obecne wymiary i kolor, pokaż podgląd.',{kind:['done'],expected:{...wide,width:'1277',opening:'DKL'},allowed:['opening']});
 await turn('analysis_without_clicking','Policz powierzchnię prostokąta 1230 na 1200 mm w m², z trzema miejscami po przecinku. Tylko odpowiedz, niczego nie zmieniaj.',{kind:['reply'],noActions:true,noRead:true,answerPattern:'1[,.]476'});
 await turn('cancel_goal','Anuluj to zadanie.',{kind:['reply'],noActions:true,noRead:true});if(session!==null)throw Error('CONVERSATION_CANCEL_DID_NOT_CLEAR');
 environment=createBrowserEval();history=[];
 const next={customer:'Baupartner',width:'950',height:'1350',color:'mahon',opening:'DKL'};
 await turn('new_request_not_permission','Czy możesz w formularzu wybrać dokładnie Baupartner, szerokość 950 mm, wysokość 1350 mm, mahoń i DKL? Pokaż podgląd, bez wysyłania.',{kind:['done'],expected:next,allowed:all});
 if(session.goal.includes('Top Trans'))throw Error('CONVERSATION_OLD_GOAL_LEAKED');
 environment=createBrowserEval();session=null;history=[];
 await turn('ambiguous_client','Wybierz klienta Top. Okno 1100 na 1000 mm, antracyt i DKR. Pokaż podgląd, nie wysyłaj.',{kind:['clarify'],allowed:['width','height','color','opening']});
 await turn('client_answer_resumes','Top Trans S.A.',{kind:['done'],expected:{...base,customer:'Top Trans S.A.',height:'1000'},allowed:all});
 fs.mkdirSync(path.dirname(cacheFile),{recursive:true});fs.writeFileSync(cacheFile,JSON.stringify({passed:true,checked_at:new Date().toISOString(),reports}));
 console.log('BROWSER_CONVERSATION=verified MODEL='+(process.env.NAVIMIND_BROWSER_MODEL||'gpt-5.4')+' CASES='+reports.length+' REAL_MODEL=True SYNTHETIC_BROWSER=True SHARED_FRONTEND_RUNNER=True');
})().catch(problem=>{console.error(problem.message.slice(0,500));process.exitCode=1;});
