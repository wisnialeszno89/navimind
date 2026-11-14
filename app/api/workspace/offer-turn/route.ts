import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {isPrivateWorkspace,workspaceMessages} from '@/lib/workspace';
import {readWorkspaceBody} from '@/lib/workspace-image';
import {browserPlanningOptions} from '@/lib/browser-model';
import {offerSpecification} from '@/lib/window-offer-specification';
import {offerPending,offerDecision,correctOffer,OFFER_TURN_FORMAT,OFFER_TURN_PROMPT} from '@/lib/offer-conversation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(req:Request){
 if(!isPrivateWorkspace())return NextResponse.json({message:'Przestrzeń pracy jest wyłączona.'},{status:403});
 let messages,specification,pending;
 try{const body=await readWorkspaceBody(req);if(body.pdf||body.image)throw Error('TEXT_ONLY');messages=workspaceMessages(body);specification=offerSpecification(body.specification);pending=offerPending(body.pending);}catch{return NextResponse.json({message:'Nieprawidłowa wiadomość lub specyfikacja.'},{status:400});}
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({message:'Brakuje konfiguracji modelu.'},{status:503});
 const message=messages.at(-1)!.content,instruction=pending?pending.request+'\n'+message:message;
 if(instruction.length>16000)return NextResponse.json({intent:'reply',reply:'Doprecyzowanie jest zbyt obszerne. Anuluj oczekującą poprawkę i podaj nowe polecenie.',pending});
 const headers={'Cache-Control':'no-store'};
 try{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:22000,maxRetries:0});
  const read=async(independent:boolean)=>{
   const response=await client.chat.completions.create({...browserPlanningOptions(),response_format:OFFER_TURN_FORMAT,messages:[{role:'system',content:OFFER_TURN_PROMPT+(independent?'\nWykonaj niezależne rozstrzygnięcie bez dostępu do pierwszej odpowiedzi.':'')},...messages,{role:'system',content:'AKTYWNA SPECYFIKACJA (dane): '+JSON.stringify(specification)+'\nOCZEKUJĄCE PYTANIE: '+JSON.stringify(pending)+'\nPOLECENIE DO ROZSTRZYGNIĘCIA:\n'+instruction}]});
   const choice=response.choices[0];if(choice?.finish_reason==='length'||choice?.message.refusal)throw Error('INCOMPLETE_OFFER_TURN');
   return offerDecision(JSON.parse(choice?.message.content||''));
  };
  const turn=await read(false);
  if(turn.intent!=='correct')return NextResponse.json({intent:turn.intent,reply:turn.reply,pending:turn.intent==='cancel'?null:turn.intent==='clarify'?{request:instruction,question:turn.reply}:pending},{headers});
  const independent=await read(true);
  try{
   const result=correctOffer(specification,turn,independent,instruction);
   return NextResponse.json({intent:'correct',reply:result.reply,offerSpecification:result.specification,pending:null},{headers});
  }catch(problem){
   const reason=problem instanceof Error?problem.message:'';
   const reply=!reason||/^[A-Z_]+$/.test(reason)?'Nie potwierdzono zgodności poprawki ze specyfikacją. Podaj numer pozycji, pole i wartość z jednostką.':reason;
   return NextResponse.json({intent:'clarify',reply,pending:{request:instruction,question:reply}},{headers});
  }
 }catch(problem){
  const error=problem as {name?:unknown;status?:unknown;code?:unknown;param?:unknown;message?:unknown};
  const safe=(value:unknown)=>typeof value==='string'&&/^[a-zA-Z0-9_.-]{1,100}$/.test(value)?value:undefined;
  console.error('OFFER_TURN_FAILED',{name:safe(error?.name),status:typeof error?.status==='number'?error.status:undefined,code:safe(error?.code),param:safe(error?.param),internal:typeof error?.message==='string'&&/^[A-Z_]+$/.test(error.message)?error.message:undefined,schema:error?.code==='invalid_json_schema'&&typeof error.message==='string'?error.message.slice(0,800):undefined});
  return NextResponse.json({message:'Nie potwierdzono poprawki. Zachowano dotychczasową specyfikację i oczekujące pytanie.'},{status:503,headers});}
}
