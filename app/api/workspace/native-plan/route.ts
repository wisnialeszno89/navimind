import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {isPrivateWorkspace,workspaceMessages} from '@/lib/workspace';
import {readWorkspaceBody} from '@/lib/workspace-image';
import {nativeSnapshot,nativeDecision,NATIVE_PROMPT} from '@/lib/native-plan';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function POST(req:Request){
 if(!isPrivateWorkspace())return NextResponse.json({message:'Przestrzeń pracy jest wyłączona.'},{status:403});
 let messages,snapshot,steps;
 try{const body=await readWorkspaceBody(req);messages=workspaceMessages(body);snapshot=nativeSnapshot(body.snapshot);if(!Array.isArray(body.steps)||body.steps.length>24||body.steps.some((s:unknown)=>typeof s!=='string'||s.length>1000))throw Error('INVALID_STEPS');steps=body.steps;}catch{return NextResponse.json({message:'Nieprawidłowe polecenie lub obraz okna.'},{status:400});}
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({message:'Brakuje konfiguracji modelu.'},{status:503});
 try{const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:22000,maxRetries:0});
 const conversation:OpenAI.Chat.Completions.ChatCompletionMessageParam[]=[{role:'system',content:NATIVE_PROMPT},...messages,{role:'user',content:[{type:'text',text:'AKTUALNE OKNO (dane): '+JSON.stringify({title:snapshot.title,width:snapshot.width,height:snapshot.height})+'\nWYNIKI KROKÓW: '+JSON.stringify(steps)},{type:'image_url',image_url:{url:snapshot.image,detail:'high'}}]}];
 for(let attempt=0;attempt<2;attempt++){
  const r=await client.chat.completions.create({model:process.env.NAVIMIND_NATIVE_MODEL||process.env.NAVIMIND_WORKSPACE_MODEL||'gpt-4.1-mini',messages:conversation,response_format:{type:'json_object'},temperature:0,max_tokens:1800});
  const content=r.choices[0]?.message.content||'';
  try{return NextResponse.json(nativeDecision(JSON.parse(content),snapshot));}catch{if(attempt===1)throw Error('INVALID_PLAN');conversation.push({role:'assistant',content},{role:'system',content:'Nieprawidłowy krok lub współrzędne. Niczego nie wykonano. Popraw jeden krok w granicach aktualnego obrazu lub zwróć review z task:null.'});}
 }
 throw Error('NO_PLAN');
 }catch{console.error('NATIVE_PLAN_FAILED');return NextResponse.json({message:'Nie udało się przygotować kroku. Nowej akcji nie wykonano.'},{status:503});}
}
