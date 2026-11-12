import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {isPrivateWorkspace,workspaceMessages} from '@/lib/workspace';
import {readWorkspaceBody} from '@/lib/workspace-image';
import {workspacePDF,documentReport,documentReply,DOCUMENT_PROMPT} from '@/lib/workspace-document';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(req:Request){
 if(!isPrivateWorkspace())return NextResponse.json({message:'Przestrzeń pracy jest wyłączona.'},{status:403});
 let messages,pdf;
 try{const body=await readWorkspaceBody(req);messages=workspaceMessages(body);pdf=await workspacePDF(body.pdf);}
 catch(problem){const large=problem instanceof Error&&problem.message==='REQUEST_TOO_LARGE';return NextResponse.json({message:'Wybierz poprawny, niezabezpieczony hasłem PDF: do 2 MB i 10 stron. Nie wykonano działań na komputerze.'},{status:large?413:400});}
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({message:'Brakuje konfiguracji modelu.'},{status:503});
 try{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:45000,maxRetries:0});
  const conversation:OpenAI.Chat.Completions.ChatCompletionMessageParam[]=[{role:'system',content:DOCUMENT_PROMPT},...messages.slice(0,-1),{role:'user',content:[{type:'text',text:messages[messages.length-1].content},{type:'file',file:{filename:'zapytanie.pdf',file_data:pdf.data}}]}];
  const response=await client.chat.completions.create({model:process.env.NAVIMIND_DOCUMENT_MODEL||'gpt-4.1-mini',messages:conversation,response_format:{type:'json_object'},temperature:0,max_tokens:8000});
  const report=documentReport(JSON.parse(response.choices[0]?.message.content||''),pdf.pages);
  return NextResponse.json({reply:documentReply(report),specification:report,agentConnected:false});
 }catch{console.error('WORKSPACE_DOCUMENT_READ_FAILED');return NextResponse.json({message:'Nie potwierdzono odczytu PDF. Dokument może być nieczytelny albo model niedostępny. Nie uruchomiono konfiguracji ani innych działań na komputerze.'},{status:503});}
}
