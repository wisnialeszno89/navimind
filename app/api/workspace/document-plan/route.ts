import {randomUUID,createHash} from 'crypto';
import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {isPrivateWorkspace,workspaceMessages} from '@/lib/workspace';
import {readWorkspaceBody} from '@/lib/workspace-image';
import {workspacePDF,documentReply,DOCUMENT_PROMPT,ORIENTATION_PROMPT,documentFormats,documentFailure} from '@/lib/workspace-document';
import {rasterPDF,pdfPageViews,pdfRendererProbe} from '@/lib/workspace-pdf-vision';
import {pageReading,mergePageReadings,PAGE_READING_INSTRUCTIONS} from '@/lib/workspace-document-pages';
import {needsMeasurementDirectives,measurementDirectiveFormat,MEASUREMENT_DIRECTIVE_PROMPT,applyMeasurementDirectives} from '@/lib/workspace-document-directives';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=120;
const PDF_READER='PDF-R3';
function providerDiagnostic(problem:unknown){
 const e=problem as {code?:unknown;param?:unknown};
 const allowed=new Set(['unsupported_parameter','model_not_found','invalid_json_schema','rate_limit_exceeded','invalid_value','invalid_api_key','insufficient_quota','unsupported_value']);
 return {provider_code:typeof e?.code==='string'&&allowed.has(e.code)?e.code:undefined,provider_param:typeof e?.param==='string'&&/^[a-z_0-9.\[\]]{1,100}$/i.test(e.param)?e.param:undefined};
}
let rendererReady:Promise<unknown>|undefined;
function ensureRenderer(){
 if(!rendererReady)rendererReady=pdfRendererProbe().catch(problem=>{
  rendererReady=undefined;
  // This probe has only generated fixture data. Its errors cannot contain
  // customer PDF text, model credentials, or provider responses.
  console.error('WORKSPACE_PDF_RENDERER_PROBE_FAILED',{reader:PDF_READER,name:problem instanceof Error?problem.name:'unknown',code:(problem as {code?:unknown})?.code,message:problem instanceof Error?problem.message.slice(0,400):'unknown'});
  throw problem;
 });
 return rendererReady;
}
export async function POST(req:Request){
 if(!isPrivateWorkspace())return NextResponse.json({message:'Przestrzeń pracy jest wyłączona.'},{status:403});
 let messages,pdf;
 try{const body=await readWorkspaceBody(req);messages=workspaceMessages(body);pdf=await workspacePDF(body.pdf);}
 catch(problem){const large=problem instanceof Error&&problem.message==='REQUEST_TOO_LARGE';return NextResponse.json({message:'Wybierz poprawny, niezabezpieczony hasłem PDF: do 2 MB i 10 stron. Nie wykonano działań na komputerze.'},{status:large?413:400});}
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({message:'Brakuje konfiguracji modelu.'},{status:503});
 const requestId=randomUUID();
 const reader=PDF_READER;
 console.info('WORKSPACE_DOCUMENT_READ_STARTED',{reader,requestId,pages:pdf.pages});
 let stage='render_pages';
 const abort=new AbortController();
 const deadline=setTimeout(()=>abort.abort(),110000);
 try{
  await ensureRenderer();
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0});
  const model=process.env.NAVIMIND_DOCUMENT_MODEL||'gpt-6.1-terra';
  const formats=documentFormats(pdf.pages);
  const sourceDigest=createHash('sha256').update(Buffer.from(pdf.data.split(',')[1],'base64')).digest('hex').slice(0,16);
  const safeModel=(name:string)=>/^(?:gpt-|o[134])[-a-z0-9.]{1,80}$/i.test(name)?name:'configured_model';
  const modelsUsed=new Set<string>();
  const parameters=(tokens:number,effort:'low'|'medium')=>/^gpt-[5-9]/.test(model)?{max_completion_tokens:tokens,reasoning_effort:effort}:{max_tokens:tokens,temperature:0};
  console.info('WORKSPACE_DOCUMENT_MODEL',{reader,requestId,model:safeModel(model),sourceDigest});
  const content=(response:OpenAI.Chat.Completions.ChatCompletion)=>{if(response.model)modelsUsed.add(safeModel(response.model));const choice=response.choices[0];if(choice?.message.refusal)throw Error('MODEL_REFUSAL');if(choice?.finish_reason==='length')throw Error('MODEL_OUTPUT_TRUNCATED');return choice?.message.content||'';};
  const image=(data:Buffer):OpenAI.Chat.Completions.ChatCompletionContentPart=>({type:'image_url',image_url:{url:'data:image/'+(data[0]===137?'png':'jpeg')+';base64,'+data.toString('base64'),detail:'high'}});
  const rasters=await rasterPDF(pdf.data,pdf.pages);
  stage='orientation_request';
  const orientation=await client.chat.completions.create({model,messages:[{role:'system',content:ORIENTATION_PROMPT},{role:'user',content:[{type:'text',text:`To ${pdf.pages} stron PDF, w kolejności. Podaj jeden obrót dla każdego obrazu.`},...rasters.map(r=>image(r.image))]}],response_format:formats.orientation,...parameters(2000,'low')},{timeout:30000,signal:abort.signal});
  stage='orientation_parse';
  const angles=JSON.parse(content(orientation));
  if(!Array.isArray(angles.rotations)||angles.rotations.length!==pdf.pages||angles.rotations.some((a:unknown)=>![0,90,180,270].includes(a as number)))throw Error('INVALID_PAGE_ORIENTATION');
  console.info('WORKSPACE_DOCUMENT_IMAGE_LAYOUT',{reader,requestId,rotations:angles.rotations,sizes:rasters.map(r=>[r.width,r.height])});
  stage='reading_pages';
  // At most three pages / six model requests in flight. Each control reading
  // receives only source pixels and the user's instruction, never the candidate.
  const readings=new Array<Parameters<typeof mergePageReadings>[0][number]>(pdf.pages);
  let next=0;
  const worker=async()=>{while(next<rasters.length){
   const index=next++,raster=rasters[index];
   const views=await pdfPageViews(raster,angles.rotations[index]);
   const parts:OpenAI.Chat.Completions.ChatCompletionContentPart[]=[{type:'text',text:`Fizyczna strona PDF ${raster.page} z ${pdf.pages}. Odczytaj dane wyłącznie z obrazów tej strony; korekty użytkownika zostaną zastosowane osobno.`}];
   for(const view of views.images)parts.push({type:'text',text:`Strona ${raster.page}: ${view.label}`},image(view.image));
   const read=async(independent:boolean)=>{
    const response=await client.chat.completions.create({model,messages:[{role:'system',content:DOCUMENT_PROMPT+'\n'+PAGE_READING_INSTRUCTIONS+(independent?'\nWykonaj niezależny odczyt kontrolny: sprawdź kompletność wszystkich pozycji i dosłowne oznaczenia. Nie masz kandydata do potwierdzenia.':'')},{role:'user',content:independent&&parts.length>3?[parts[0],...parts.slice(3),...parts.slice(1,3)]:parts}],response_format:formats.pageReading,...parameters(10000,'medium')},{timeout:55000,signal:abort.signal});
    return pageReading(JSON.parse(content(response)),pdf.pages,raster.page);
   };
   const [primary,independent]=await Promise.all([read(false),read(true)]);
   readings[index]={page:raster.page,primary,independent};
  }};
  await Promise.all(Array.from({length:Math.min(3,pdf.pages)},()=>worker()));
  stage='compare_readings';
  let merged=mergePageReadings(readings,pdf.pages);
  const instruction=messages[messages.length-1].content;
  let corrections:ReturnType<typeof applyMeasurementDirectives>|undefined;
  if(needsMeasurementDirectives(instruction)){
   stage='user_directives';
   try{
    const response=await client.chat.completions.create({model,messages:[{role:'system',content:MEASUREMENT_DIRECTIVE_PROMPT},{role:'user',content:instruction}],response_format:measurementDirectiveFormat,...parameters(4000,'low')},{timeout:30000,signal:abort.signal});
    corrections=applyMeasurementDirectives(merged,JSON.parse(content(response)),instruction);
   }catch(problem){
    const failure=documentFailure(problem,stage,requestId);
    console.error('WORKSPACE_DOCUMENT_DIRECTIVES_REVIEW',{reader,requestId,code:failure.code,...providerDiagnostic(problem)});
    merged={...merged,requires_clarification:true,notes:[...merged.notes,'Nie potwierdzono zastosowania korekt użytkownika. Poniższe wartości pozostają odczytem źródła i wymagają sprawdzenia przed konfiguracją.']};
   }
  }
  const report={...(corrections||merged),page_rotations:angles.rotations,models_used:[...modelsUsed],source_digest:sourceDigest};
  console.info('WORKSPACE_DOCUMENT_READ_FINISHED',{reader,requestId,pages:pdf.pages,positions:report.positions.length,review:report.requires_clarification});
  return NextResponse.json({reply:documentReply(report)+`\n\nOdczyt: ${reader} · model: ${[...modelsUsed].join(', ')||safeModel(model)} · numer próby: ${requestId}`,specification:report,reader,requestId,agentConnected:false},{headers:{'Cache-Control':'no-store'}});
 }catch(problem){const failure=documentFailure(problem,stage,requestId);const status=(problem as {status?:unknown})?.status;console.error('WORKSPACE_DOCUMENT_READ_FAILED',{reader,stage,code:failure.code,requestId,provider_status:typeof status==='number'?status:undefined,...providerDiagnostic(problem)});abort.abort();return NextResponse.json({...failure,reader,message:failure.message+` Odczyt: ${reader}.`},{status:503,headers:{'Cache-Control':'no-store'}});}finally{clearTimeout(deadline);}
}


export async function GET(){
 if(!isPrivateWorkspace())return NextResponse.json({ready:false},{status:403});
 const requestId=randomUUID();
 try{await ensureRenderer();return NextResponse.json({ready:true,reader:PDF_READER,requestId},{headers:{'Cache-Control':'no-store'}});}
 catch(problem){const failure=documentFailure(problem,'render_pages',requestId);return NextResponse.json({ready:false,...failure},{status:503,headers:{'Cache-Control':'no-store'}});}
}
