import {createHash,randomUUID} from 'crypto';
import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {isPrivateWorkspace,workspaceMessages} from '@/lib/workspace';
import {readWorkspaceBody} from '@/lib/workspace-image';
import {documentFormats} from '@/lib/workspace-document';
import {mergePageReadings} from '@/lib/workspace-document-pages';
import {toOfferSpecification,normalizeSalesOpening} from '@/lib/window-offer-specification';
import {ENQUIRY_PROMPT,enquiryReading,enquiryReply} from '@/lib/window-enquiry';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=120;
export async function POST(req:Request){
 if(!isPrivateWorkspace())return NextResponse.json({error:'WORKSPACE_DISABLED'},{status:403});
 let text:string;
 try{const body=await readWorkspaceBody(req);if(body.pdf||body.image)throw Error('TEXT_ONLY');const messages=workspaceMessages(body);text=messages[messages.length-1].content;}
 catch{return NextResponse.json({message:'Wklej pełne aktualne zapytanie tekstowe do 8000 znaków, bez załączników.'},{status:400});}
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({message:'Brakuje konfiguracji modelu.'},{status:503});
 const requestId=randomUUID(),abort=new AbortController(),deadline=setTimeout(()=>abort.abort(),105000);
 try{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0});
  const model=process.env.NAVIMIND_ENQUIRY_MODEL||process.env.NAVIMIND_DOCUMENT_MODEL||'gpt-6.1-terra';
  const parameters=/^gpt-[5-9]/.test(model)?{max_completion_tokens:10000,reasoning_effort:'medium' as const}:{max_tokens:10000,temperature:0};
  const read=async(independent:boolean)=>{
   const response=await client.chat.completions.create({model,messages:[{role:'system',content:ENQUIRY_PROMPT+(independent?'\nTo niezależny odczyt kontrolny. Sprawdź kompletność i przypisanie danych do pozycji bez dostępu do pierwszej odpowiedzi.':'')},{role:'user',content:text}],response_format:documentFormats(1).reading,...parameters},{timeout:100000,signal:abort.signal});
   const choice=response.choices[0];if(choice?.finish_reason==='length'||choice?.message.refusal||!choice?.message.content)throw Error('INCOMPLETE_ENQUIRY_READING');
   const report=normalizeSalesOpening(enquiryReading(JSON.parse(choice.message.content),text));
   return {...report,page_status:'products' as const};
  };
  const [primary,independent]=await Promise.all([read(false),read(true)]);
  const merged=mergePageReadings([{page:1,primary,independent}],1);
  const specification=toOfferSpecification(merged,{kind:'text',sha256:createHash('sha256').update(text).digest('hex'),pages:null});
  return NextResponse.json({reply:enquiryReply(specification),offerSpecification:specification,requestId,agentConnected:false},{headers:{'Cache-Control':'no-store'}});
 }catch(problem){
  abort.abort();
  const name=problem instanceof Error?problem.name:'unknown';
  console.error('WINDOW_ENQUIRY_READ_FAILED',{requestId,name});
  return NextResponse.json({message:'Nie potwierdzono pełnego odczytu zapytania. Nie wykonano działań. Spróbuj ponownie z kompletnym tekstem.',requestId},{status:503,headers:{'Cache-Control':'no-store'}});
 }finally{clearTimeout(deadline);}
}
