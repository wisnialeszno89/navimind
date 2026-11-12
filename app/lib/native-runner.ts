import {localRequest} from './desktop-connection';
import type {NativeSnapshot} from './native-plan';
type Hooks={progress:(text:string)=>void;stopped:()=>boolean;pending:(id:string|null)=>void;executed:()=>void};
export async function runNativeCommand(token:string,message:string,history:{role:string;content:string}[],hooks:Hooks){
 if(hooks.stopped())return {reply:'Zadanie zatrzymane przed rozpoczęciem.'};
 const initial=await localRequest<NativeSnapshot & {session:string}>(token,'/native/start',{});
 const {session,...view}=initial;
 if(typeof session!=='string'||!/^[a-f0-9]{32}$/.test(session))throw Error('Zaktualizuj lokalnego wykonawcę aplikacji.');
 let snapshot:NativeSnapshot=view;
 const steps:string[]=[],attempts=new Map<string,number>();let stale=0;
 for(let turn=0;turn<24;turn++){
  if(hooks.stopped())return {reply:'Zatrzymałem zadanie w aplikacji. Wykonane kroki pozostają na płótnie.'};
  hooks.progress(`Analizuję obraz okna, krok ${turn+1}/24…`);
  const response=await fetch('/api/workspace/native-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history,snapshot,steps})});
  const plan=await response.json();if(!response.ok)throw Error(plan.message||'Nie udało się zaplanować kroku.');
  if(hooks.stopped())return {reply:'Zatrzymałem zadanie przed następną akcją.'};
  if(!plan.task&&plan.decision!=='done')return {reply:plan.reply};
  const task=plan.task||{kind:'native_finish'};
  const signature=JSON.stringify([snapshot.revision,task]);
  if((attempts.get(signature)||0)>=2)return {reply:'Zatrzymałem powtarzane próby na niezmienionym obrazie. Sprawdź płótno Painta.'};
  hooks.progress(`Krok ${turn+1}/24: ${plan.reply}`);
  const id=crypto.randomUUID();hooks.pending(id);
  const result=await localRequest<any>(token,'/execute',{id,task,expectedRevision:plan.expectedRevision,session});
  hooks.pending(null);
  steps.push(JSON.stringify({task,result:result.message,status:result.status}).slice(0,1000));
  if(result.code==='STALE_NATIVE_FRAME'&&stale<2&&!hooks.stopped()){stale++;snapshot=await localRequest(token,'/native/observe');continue;}
  if(result.status!=='verified')return {reply:'**Potrzebne sprawdzenie.** '+result.message};
  hooks.executed();attempts.set(signature,(attempts.get(signature)||0)+1);
  if(result.native_result)return {reply:plan.reply,result};
  if(!result.native)throw Error('Brak obrazu po kroku. Sprawdź aplikację.');
  snapshot=result.native;
 }
 return {reply:'Zatrzymałem po 24 krokach. Nie uznaję całego zadania za zakończone; sprawdź obraz aplikacji.'};
}
