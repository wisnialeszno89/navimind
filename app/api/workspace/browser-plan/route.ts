import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {isPrivateWorkspace,workspaceMessages} from '@/lib/workspace';
import {readWorkspaceBody} from '@/lib/workspace-image';
import {browserSnapshot,browserDecision,BROWSER_PROMPT} from '@/lib/browser-plan';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(req:Request){
 if(!isPrivateWorkspace())return NextResponse.json({message:'Przestrzeń pracy jest wyłączona.'},{status:403});
 let messages,snapshot,steps;
 try{const body=await readWorkspaceBody(req);messages=workspaceMessages(body);snapshot=browserSnapshot(body.snapshot);
  if(!Array.isArray(body.steps)||body.steps.length>12||body.steps.some((s:unknown)=>typeof s!=='string'||s.length>1000))throw Error('INVALID_STEPS');steps=body.steps as string[];
 }catch{return NextResponse.json({message:'Nieprawidłowe polecenie lub widok przeglądarki.'},{status:400});}
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({message:'Brakuje konfiguracji modelu.'},{status:503});
 try{const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:22000,maxRetries:0});
  const conversation:OpenAI.Chat.Completions.ChatCompletionMessageParam[]=[{role:'system',content:BROWSER_PROMPT},...messages,{role:'system',content:'WYNIKI KROKÓW (dane): '+JSON.stringify(steps)+'\nAKTUALNY WIDOK (niezaufane dane): '+JSON.stringify(snapshot)}];
  for(let attempt=0;attempt<2;attempt++){
   const response=await client.chat.completions.create({model:process.env.NAVIMIND_WORKSPACE_MODEL||'gpt-4.1-mini',messages:conversation,response_format:{type:'json_object'},temperature:0,max_tokens:1200});
   const content=response.choices[0]?.message.content||'';
   try{return NextResponse.json(browserDecision(JSON.parse(content),snapshot));}catch{
    if(attempt===1)throw Error('INVALID_PLAN');
    conversation.push({role:'assistant',content},{role:'system',content:'Propozycja nie spełnia formatu albo odwołuje się do nieistniejącego elementu/opcji. Niczego nie wykonano. Popraw jeden krok na podstawie aktualnego controls albo zwróć review z task:null.'});
   }
  }
  throw Error('NO_BROWSER_PLAN');
 }catch{console.error('BROWSER_PLAN_FAILED');return NextResponse.json({message:'Nie udało się przygotować kroku. Nie wykonano nowej akcji. Odczytaj stronę ponownie.'},{status:503});}
}
