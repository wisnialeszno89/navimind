import type {BrowserSnapshot,BrowserTask} from './browser-plan';
import {browserStepReceipt} from './browser-step-receipt';
import {browserTurn,newBrowserSession,continueBrowserSession,rememberBrowserReceipt,MAX_BROWSER_STEPS,type BrowserSession} from './browser-session';
export type BrowserExecution={status:'verified'|'review';message:string;code?:string;browser?:BrowserSnapshot;browser_export?:{image_file:string;report_file:string;goal_verified:boolean;price_verified:boolean;screenshot_scope:string}};
type History={role:string;content:string}[];
type Plan={decision:string;reply:string;task:BrowserTask|null;expectedRevision:string|null};
type Ports={
 turn:(body:unknown)=>Promise<unknown>;plan:(body:unknown)=>Promise<Plan>;observe:()=>Promise<BrowserSnapshot>;execute:(body:unknown)=>Promise<BrowserExecution>;
 changed:(session:BrowserSession|null)=>void;progress:(text:string)=>void;stopped:()=>boolean;pending:(id:string|null)=>void;executed:()=>void;id:()=>string;
};
export type BrowserOutcome={kind:string;reply:string;snapshot?:BrowserSnapshot;result?:BrowserExecution};
export async function runBrowserConversation(message:string,history:History,initial:BrowserSession|null,ports:Ports):Promise<BrowserOutcome>{
 let session=initial;
 const save=(next:BrowserSession|null)=>{session=next;ports.changed(next);};
 const pause=(reply:string)=>{if(session)save({...session,status:'paused'});return {kind:'paused',reply};};
 if(ports.stopped())return pause('Zatrzymałem zadanie przed rozpoczęciem.');
 ports.progress('Rozumiem wiadomość i sprawdzam kontekst zadania…');
 const turn=browserTurn(await ports.turn({message,history,session}),session);
 if(ports.stopped())return pause('Zatrzymałem przed wykonaniem nowej akcji.');
 if(turn.intent==='reply')return {kind:'reply',reply:turn.reply};
 if(turn.intent==='cancel'){save(null);return {kind:'reply',reply:turn.reply};}
 if(turn.intent==='inspect'){
  const snapshot=await ports.observe();
  if(ports.stopped())return pause('Zatrzymałem po odczycie strony, bez wykonywania akcji.');
  const answer=browserTurn(await ports.turn({message,history,session,snapshot}),session);
  return {kind:'reply',reply:answer.intent==='reply'?answer.reply:'Odczytałem stronę bez wykonywania akcji, ale nie uzyskałem jednoznacznej odpowiedzi.',snapshot};
 }
 save(turn.intent==='start'?newBrowserSession(ports.id(),message):continueBrowserSession(session!,message));
 let snapshot=await ports.observe();
 const steps:string[]=[JSON.stringify({observed_url:snapshot.url,source:'initial_observation'})];
 if(session)save(rememberBrowserReceipt(session,steps[0]));
 const noEffect=new Map<string,number>();let stale=0;
 const viewKey=(view:BrowserSnapshot)=>JSON.stringify([view.url,view.text,view.controls.map(({ref,...control})=>control)]);
 for(let step=0;step<MAX_BROWSER_STEPS;step++){
  if(ports.stopped())return pause('Zatrzymałem zadanie. Możesz później napisać „kontynuuj”.');
  ports.progress(`Analizuję stan i planuję krok ${step+1}/${MAX_BROWSER_STEPS}…`);
  const plan=await ports.plan({message,history,session,snapshot,steps});
  if(ports.stopped())return pause('Zatrzymałem przed następną akcją.');
  if(!plan.task){
   if(session)save({...session,status:plan.decision==='done'?'completed':plan.decision==='clarify'?'awaiting':'paused',question:plan.decision==='clarify'?plan.reply:null});
   return {kind:plan.decision,reply:plan.reply,snapshot};
  }
  const task=plan.task;
  const before=viewKey(snapshot),target='ref' in task?snapshot.controls.find(c=>c.ref===task.ref)?.name:task.kind;
  const key=JSON.stringify([before,plan.task.kind,target]);
  if((noEffect.get(key)||0)>=2)return pause('Zatrzymałem dwie nieskuteczne próby dla elementu „'+String(target)+'”. Zachowałem cel i wykonane kroki.');
  ports.progress(`Krok ${step+1}/${MAX_BROWSER_STEPS}: ${plan.reply}`);
  const id=ports.id();ports.pending(id);
  const result=await ports.execute({id,task:plan.task,expectedRevision:plan.expectedRevision});
  ports.pending(null);
  const receipt=browserStepReceipt(snapshot,plan.task,result);steps.push(receipt);
  if(session)save(rememberBrowserReceipt(session,receipt));
  if(result.code==='STALE_PAGE'&&stale<2){stale++;snapshot=await ports.observe();continue;}
  if(result.status!=='verified'||!result.browser)return pause(result.message+' Zachowałem zadanie; nie ponowiłem niepotwierdzonej akcji.');
  ports.executed();snapshot=result.browser;
  if(result.browser_export){if(session)save({...session,status:'completed',question:null});return {kind:'export',reply:result.message,result,snapshot};}
  if(plan.task.kind==='browser_click'&&viewKey(snapshot)===before)noEffect.set(key,(noEffect.get(key)||0)+1);
 }
 return pause('Zachowałem cel i wykonane kroki po osiągnięciu limitu tej tury. Możesz napisać „kontynuuj”.');
}
