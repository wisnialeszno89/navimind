import {randomUUID} from 'crypto';
import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {isPrivateWorkspace,workspaceMessages} from '@/lib/workspace';
import {readWorkspaceBody} from '@/lib/workspace-image';
import {workspacePDF,documentReply,DOCUMENT_PROMPT,ORIENTATION_PROMPT,documentFormats,documentFailure} from '@/lib/workspace-document';
import {rasterPDF,pdfPageViews} from '@/lib/workspace-pdf-vision';
import {pageReading,mergePageReadings,PAGE_READING_INSTRUCTIONS} from '@/lib/workspace-document-pages';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=120;
export async function POST(req:Request){
 if(!isPrivateWorkspace())return NextResponse.json({message:'Przestrzeń pracy jest wyłączona.'},{status:403});
 let messages,pdf;
 try{const body=await readWorkspaceBody(req);messages=workspaceMessages(body);pdf=await workspacePDF(body.pdf);}
 catch(problem){const large=problem instanceof Error&&problem.message==='REQUEST_TOO_LARGE';return NextResponse.json({message:'Wybierz poprawny, niezabezpieczony hasłem PDF: do 2 MB i 10 stron. Nie wykonano działań na komputerze.'},{status:large?413:400});}
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({message:'Brakuje konfiguracji modelu.'},{status:503});
 const requestId=randomUUID();
 const reader='PDF-R2';
 console.info('WORKSPACE_DOCUMENT_READ_STARTED',{reader,requestId,pages:pdf.pages});
 let stage='render_pages';
 const abort=new AbortController();
 const deadline=setTimeout(()=>abort.abort(),110000);
 try{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0});
  const model=process.env.NAVIMIND_DOCUMENT_MODEL||'gpt-4.1';
  const formats=documentFormats(pdf.pages);
  const content=(response:OpenAI.Chat.Completions.ChatCompletion)=>{const choice=response.choices[0];if(choice?.message.refusal)throw Error('MODEL_REFUSAL');if(choice?.finish_reason==='length')throw Error('MODEL_OUTPUT_TRUNCATED');return choice?.message.content||'';};
  const image=(data:Buffer):OpenAI.Chat.Completions.ChatCompletionContentPart=>({type:'image_url',image_url:{url:'data:image/'+(data[0]===137?'png':'jpeg')+';base64,'+data.toString('base64'),detail:'high'}});
  const rasters=await rasterPDF(pdf.data,pdf.pages);
  stage='orientation_request';
  const orientation=await client.chat.completions.create({model,messages:[{role:'system',content:ORIENTATION_PROMPT},{role:'user',content:[{type:'text',text:`To ${pdf.pages} stron PDF, w kolejności. Podaj jeden obrót dla każdego obrazu.`},...rasters.map(r=>image(r.image))]}],response_format:formats.orientation,temperature:0,max_tokens:500},{timeout:30000,signal:abort.signal});
  stage='orientation_parse';
  const angles=JSON.parse(content(orientation));
  if(!Array.isArray(angles.rotations)||angles.rotations.length!==pdf.pages||angles.rotations.some((a:unknown)=>![0,90,180,270].includes(a as number)))throw Error('INVALID_PAGE_ORIENTATION');
  stage='reading_pages';
  // At most three pages / six model requests in flight. Each control reading
  // receives only source pixels and the user's instruction, never the candidate.
  const readings=new Array<Parameters<typeof mergePageReadings>[0][number]>(pdf.pages);
  let next=0;
  const worker=async()=>{while(next<rasters.length){
   const index=next++,raster=rasters[index];
   const views=await pdfPageViews(raster,angles.rotations[index]);
   const parts:OpenAI.Chat.Completions.ChatCompletionContentPart[]=[{type:'text',text:`Fizyczna strona PDF ${raster.page} z ${pdf.pages}. Wskazówki użytkownika: ${messages[messages.length-1].content}`}];
   for(const view of views.images)parts.push({type:'text',text:`Strona ${raster.page}: ${view.label}`},image(view.image));
   const read=async(independent:boolean)=>{
    const response=await client.chat.completions.create({model,messages:[{role:'system',content:DOCUMENT_PROMPT+'\n'+PAGE_READING_INSTRUCTIONS+(independent?'\nWykonaj niezależny odczyt kontrolny: sprawdź kompletność wszystkich pozycji i dosłowne oznaczenia. Nie masz kandydata do potwierdzenia.':'')},{role:'user',content:independent&&parts.length===7?[parts[0],...parts.slice(3),...parts.slice(1,3)]:parts}],response_format:formats.pageReading,temperature:0,max_tokens:8000},{timeout:55000,signal:abort.signal});
    return pageReading(JSON.parse(content(response)),pdf.pages,raster.page);
   };
   const [primary,independent]=await Promise.all([read(false),read(true)]);
   readings[index]={page:raster.page,primary,independent};
  }};
  await Promise.all(Array.from({length:Math.min(3,pdf.pages)},()=>worker()));
  stage='compare_readings';
  const report={...mergePageReadings(readings,pdf.pages),page_rotations:angles.rotations};
  console.info('WORKSPACE_DOCUMENT_READ_FINISHED',{reader,requestId,pages:pdf.pages,positions:report.positions.length,review:report.requires_clarification});
  return NextResponse.json({reply:documentReply(report)+`\n\nOdczyt: ${reader} · numer próby: ${requestId}`,specification:report,reader,requestId,agentConnected:false},{headers:{'Cache-Control':'no-store'}});
 }catch(problem){const failure=documentFailure(problem,stage,requestId);const status=(problem as {status?:unknown})?.status;console.error('WORKSPACE_DOCUMENT_READ_FAILED',{reader,stage,code:failure.code,requestId,provider_status:typeof status==='number'?status:undefined});abort.abort();return NextResponse.json({...failure,reader,message:failure.message+` Odczyt: ${reader}.`},{status:503,headers:{'Cache-Control':'no-store'}});}finally{clearTimeout(deadline);}
}
