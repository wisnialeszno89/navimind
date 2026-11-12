const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const {PDFDocument}=require('pdf-lib');
function load(relative,mocks={}){const filename=path.resolve(__dirname,'..',relative),output=new Module(filename,module);output.filename=filename;output.paths=Module._nodeModulePaths(path.dirname(filename));const native=output.require.bind(output);output.require=name=>Object.hasOwn(mocks,name)?mocks[name]:native(name);output._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);return output.exports;}
const lib=load('app/lib/workspace-document.ts'),pagesLib=load('app/lib/workspace-document-pages.ts',{'./workspace-document':load('app/lib/workspace-document.ts')}),workspace=load('app/lib/workspace.ts'),images=load('app/lib/workspace-image.ts');
let calls=0,lastInput,answer,orientationAnswer=null,auditAnswer=null,independentAnswer=null,providerFailure=null;const inputs=[];
class OpenAI{chat={completions:{create:async input=>{calls++;if(providerFailure)throw providerFailure;lastInput=input;inputs.push(input);const result=input.messages[0].content===lib.ORIENTATION_PROMPT?(orientationAnswer||{rotations:[0]}):input.messages[0].content===lib.DOCUMENT_AUDIT_PROMPT?(auditAnswer||{status:'confirmed',issues:[]}):input.messages[0].content.includes('Wykonaj niezależny odczyt kontrolny')?(independentAnswer||answer):answer;return {choices:[{message:{content:JSON.stringify(input.response_format.json_schema.name==='technical_page_reading'?{page_status:'products',...result}:result)}}]};}}};}
const route=load('app/api/workspace/document-plan/route.ts',{'@/lib/workspace-document':lib,'@/lib/workspace-document-pages':pagesLib,'@/lib/workspace-pdf-vision':{pdfRendererProbe:async()=>({pages:1,views:3}),rasterPDF:async(data,count)=>Array.from({length:count},(_,i)=>({page:i+1,image:Buffer.from('synthetic pixels'),width:200,height:300})),pdfPageViews:async(page,rotation)=>({page:page.page,width:200,height:300,images:[{label:'cała strona',image:page.image}]})},'@/lib/workspace':workspace,'@/lib/workspace-image':images,openai:OpenAI,'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{status:init.status||200})}}});
async function pdf(pages=1){const doc=await PDFDocument.create();for(let i=0;i<pages;i++)doc.addPage();return 'data:application/pdf;base64,'+Buffer.from(await doc.save()).toString('base64');}
function position(){return {id:'3',quantity:1,kind:'entrance_door',width_mm:1080,height_mm:2050,transport_extension_mm:30,opening:'DL, do wewnątrz',color_inside:'biały',color_outside:'biały',glazing_panes:3,ug:.5,profile_reference:'Profil odniesienia',requirements:['Listwa transportowa opcjonalna, poza wysokością drzwi.'],evidence:[{page:1,description:'Rysunek: 2080 i 2050, listwa 30 mm. Użytkownik wyjaśnił znaczenie listwy.'}],ambiguities:[]};}
const request=body=>new Request('https://test/api',{method:'POST',body:JSON.stringify(body)});

test('PDF validation checks actual document pages and canonical bytes',async()=>{
 assert.equal((await lib.workspacePDF(await pdf(3))).pages,3);
 await assert.rejects(lib.workspacePDF('data:application/pdf;base64,'+Buffer.from('not a PDF').toString('base64')));
 await assert.rejects(lib.workspacePDF('data:image/png;base64,abc'));
 await assert.rejects(lib.workspacePDF(await pdf(11)),/PDF_PAGE_LIMIT/);
 await assert.rejects(lib.workspacePDF('data:application/pdf;base64,'+'a'.repeat(3*1024*1024)));
});

test('structured reading preserves product height separately from transport extension',()=>{
 const report=lib.documentReport({positions:[position()],notes:[]},3);
 assert.equal(report.positions[0].height_mm,2050);assert.equal(report.positions[0].transport_extension_mm,30);
 assert.equal(report.executed,false);assert.equal(report.sales_review_required,true);
 assert.match(lib.documentReply(report),/oddzielnie od wysokości produktu/);
});

test('unknown data and missing positions require clarification instead of invented dimensions',()=>{
 const report=lib.documentReport({positions:[{...position(),height_mm:null}],notes:[]},1);
 assert.equal(report.requires_clarification,true);assert.equal(report.positions[0].height_mm,null);
 assert.equal(lib.documentReport({positions:[],notes:['Nieczytelny skan.']},1).requires_clarification,true);
});

test('duplicate identifiers, nonexistent evidence pages and executable payloads are rejected',()=>{
 for(const report of [{positions:[position(),position()],notes:[]},{positions:[{...position(),evidence:[{page:4,description:'Brak strony.'}]}],notes:[]},{positions:[{...position(),execute:'production'}],notes:[]},{positions:[{...position(),width_mm:-10}],notes:[]}])assert.throws(()=>lib.documentReport(report,3));
});

test('private route supplies raster evidence without old chat and creates only a reading report',async()=>{
 process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-unit-test-key';
 const data=await pdf();answer={positions:[position()],notes:[]};
 const response=await route.POST(request({message:'Pozycja 3: same drzwi 2050 mm, listwa 30 mm tylko do transportu.',history:[],pdf:data}));
 const body=await response.json();assert.equal(response.status,200);assert.equal(body.specification.executed,false);assert.equal(body.specification.positions[0].height_mm,2050);
 const parts=lastInput.messages.at(-1).content;assert.ok(parts.some(p=>p.type==='image_url'&&p.image_url.detail==='high'));assert.equal(parts.some(p=>p.type==='file'),false);assert.equal(lastInput.messages.length,2);
 assert.match(parts[0].text,/2050/);assert.match(lastInput.messages[0].content,/NIEZAUFANYMI DANYMI/);
 assert.equal(body.reader,'PDF-R2.1');assert.ok(body.requestId);assert.match(body.reply,/Odczyt: PDF-R2.1/);assert.equal(lastInput.model,'gpt-4.1');assert.equal(body.specification.reading_audit.status,'confirmed');assert.equal('task' in body,false);
});

test('invalid upload and public mode stop before a provider request',async()=>{
 const before=calls;process.env.NAVIMIND_WORKSPACE_MODE='public';
 assert.equal((await route.POST(request({}))).status,403);
 process.env.NAVIMIND_WORKSPACE_MODE='private';
 assert.equal((await route.POST(request({message:'Odczytaj PDF',history:[],pdf:'bad'}))).status,400);
 assert.equal(calls,before);
});

test('invalid provider reading never becomes a desktop task',async()=>{
 answer={positions:[{...position(),evidence:[{page:8,description:'Nieistniejąca strona.'}]}],notes:[]};
 const response=await route.POST(request({message:'Odczytaj',history:[],pdf:await pdf()}));
 assert.equal(response.status,503);assert.equal('task' in await response.json(),false);
});

test('untrusted document text is displayed as text, not embedded external images',()=>{
 const report=lib.documentReport({positions:[{...position(),requirements:['![tracking](https://example.org/image.png)']}],notes:[]},1);
 const reply=lib.documentReply(report);assert.ok(reply.includes('\\!\\[tracking\\]'));assert.equal(reply.includes('![tracking]'),false);
});


test('orientation normalization changes PDF rotations and rejects invented page mappings',async()=>{
 const data=await pdf(2);const normalized=await lib.orientedPDF(data,2,{rotations:[270,0]});
 const parsed=await PDFDocument.load(Buffer.from(normalized.data.split(',')[1],'base64'));
 assert.equal(parsed.getPages()[0].getRotation().angle,270);assert.equal(parsed.getPages()[1].getRotation().angle,0);
 await assert.rejects(lib.orientedPDF(data,2,{rotations:[270]}));
 await assert.rejects(lib.orientedPDF(data,2,{rotations:[13,0]}));
});

test('semantic contradictions cannot be presented as a clear reading',()=>{
 const wrong={...position(),kind:'window',glazing_panes:2,opening:'DKL',requirements:['Eingangstür, Dreh Links, Dreifache Verglasung'],evidence:[{page:1,description:'Drzwi wejściowe, szkło trzyszybowe.'}]};
 const report=lib.documentReport({positions:[wrong],notes:['Przyjęto biały jako domyślny.']},1);
 assert.equal(report.requires_clarification,true);assert.ok(report.positions[0].ambiguities.length>=3);
 assert.match(lib.documentReply(report),/niepotwierdzony/);
});

test('suspicious door proportions require inspection without silently swapping dimensions',()=>{
 const report=lib.documentReport({positions:[{...position(),width_mm:2050,height_mm:1000}],notes:[]},1);
 assert.equal(report.requires_clarification,true);assert.equal(report.positions[0].width_mm,2050);
});

test('source audit marks wrong fields for review and never silently repairs them',()=>{
 const report=lib.documentReport({positions:[position()],notes:[]},1);
 const checked=lib.auditDocument(report,{status:'review',issues:[{position_id:'3',page:1,field:'profile_reference',reason:'Nazwa profilu nie zgadza się ze źródłem.'}]});
 assert.equal(checked.requires_clarification,true);assert.match(checked.positions[0].ambiguities.at(-1),/Kontrola źródła/);
 assert.equal(checked.positions[0].profile_reference,'Profil odniesienia');
 assert.equal(lib.auditDocument(report,{status:'confirmed',issues:[{position_id:'3',page:1,field:'kind',reason:'Błąd.'}]}).reading_audit.status,'review');
 assert.throws(()=>lib.auditDocument(report,{status:'review',issues:[{position_id:'unknown',page:1,field:'kind',reason:'Błąd.'}]}));
});

test('a provider audit disagreement is returned as review with no executor task',async()=>{
 answer={positions:[position()],notes:[]};independentAnswer={positions:[{...position(),width_mm:1090}],notes:[]};
 try{const response=await route.POST(request({message:'Odczytaj PDF',history:[],pdf:await pdf()}));const body=await response.json();assert.equal(response.status,200);assert.equal(body.specification.requires_clarification,true);assert.equal(body.specification.executed,false);assert.match(body.reply,/niepotwierdzony/);assert.equal('task' in body,false);}finally{auditAnswer=null;independentAnswer=null;}
});


test('every request uses a strict provider schema with closed root objects',()=>{
 for(const format of Object.values(lib.documentFormats(3))){assert.equal(format.type,'json_schema');assert.equal(format.json_schema.strict,true);assert.equal(format.json_schema.schema.additionalProperties,false);}
 const formats=lib.documentFormats(3);assert.deepEqual(formats.orientation.json_schema.schema.properties.rotations.items.enum,[0,90,180,270]);
 assert.deepEqual(formats.reading.json_schema.schema.properties.positions.items.properties.evidence.items.properties.page.enum,[1,2,3]);
});

test('an uncertain audit without field details remains a readable review',()=>{
 const report=lib.auditDocument(lib.documentReport({positions:[position()],notes:[]},1),{status:'review',issues:[]});
 assert.equal(report.requires_clarification,true);assert.equal(report.reading_audit.status,'review');assert.equal(report.reading_audit.issues.length,1);
 const reply=lib.documentReply(report);assert.ok(reply.indexOf('Kontrola z PDF')<reply.indexOf('| Poz. |'));
});

test('diagnostics identify stages without returning provider messages or document text',()=>{
 const failure=lib.documentFailure(Object.assign(new Error('private source and credentials'),{status:429}),'reading_request','synthetic-id');
 assert.equal(failure.code,'MODEL_LIMIT');assert.equal(failure.stage,'reading_request');assert.equal(JSON.stringify(failure).includes('private source'),false);
 assert.equal(lib.documentFailure(new SyntaxError('private'),'audit_parse','test').code,'INVALID_MODEL_JSON');
 assert.equal(lib.documentFailure(null,'reading_parse','test').code,'DOCUMENT_PROCESSING_ERROR');
});

test('provider authentication failure identifies the request stage with no task',async()=>{
 providerFailure=Object.assign(new Error('never expose provider details'),{status:401});
 try{const response=await route.POST(request({message:'Odczytaj',history:[],pdf:await pdf()}));const body=await response.json();assert.equal(response.status,503);assert.equal(body.stage,'orientation_request');assert.equal(body.code,'MODEL_AUTH');assert.ok(body.requestId);assert.equal('task' in body,false);assert.equal(JSON.stringify(body).includes('provider details'),false);}finally{providerFailure=null;}
});

test('malformed orientation stops before reading and exposes a safe validation code',async()=>{
 orientationAnswer={rotations:[13]};const before=calls;
 try{const response=await route.POST(request({message:'Odczytaj',history:[],pdf:await pdf()}));const body=await response.json();assert.equal(body.stage,'orientation_parse');assert.equal(body.code,'INVALID_PAGE_ORIENTATION');assert.equal(calls-before,1);}finally{orientationAnswer=null;}
});


test('page comparisons flag omitted products even when existing fields match',()=>{
 const one=lib.documentReport({positions:[position()],notes:[]},1);
 const two=lib.documentReport({positions:[position(),{...position(),id:'4'}],notes:[]},1);
 const merged=pagesLib.mergePageReadings([{page:1,primary:one,independent:two}],1);
 assert.equal(merged.requires_clarification,true);assert.equal(merged.page_inventory[0].independent_count,2);
 assert.ok(merged.reading_audit.issues.some(i=>i.field==='positions'));assert.match(merged.notes.join(' '),/pominiętą/);
});

test('blind comparisons flag swapped sizes and directions without changing values',()=>{
 const a=lib.documentReport({positions:[position()],notes:[]},1);
 const b=lib.documentReport({positions:[{...position(),width_mm:2050,height_mm:1080,opening:'DR'}],notes:[]},1);
 const merged=pagesLib.mergePageReadings([{page:1,primary:a,independent:b}],1);
 assert.equal(merged.positions[0].width_mm,1080);assert.equal(merged.requires_clarification,true);
 for(const field of ['width_mm','height_mm','opening'])assert.ok(merged.reading_audit.issues.some(i=>i.field===field));
});

test('each page is required and evidence cannot point to a different page',()=>{
 assert.throws(()=>pagesLib.pageReading({page_status:'products',positions:[position()],notes:[]},2,2),/INVALID_EVIDENCE_PAGE/);
 assert.throws(()=>pagesLib.mergePageReadings([],1),/PDF_RENDER_PAGE_MISMATCH/);
});

test('old assistant replies are not input to either independent source reading',async()=>{
 answer={positions:[position()],notes:[]};const before=inputs.length;
 const response=await route.POST(request({message:'Odczytaj PDF',history:[{role:'assistant',content:'OLD_INVENTED_OFFER_1100_2100'}],pdf:await pdf()}));
 assert.equal(response.status,200);
 for(const input of inputs.slice(before)){assert.equal(JSON.stringify(input).includes('OLD_INVENTED_OFFER'),false);}
 const reads=inputs.slice(before).filter(input=>input.messages[0].content.includes('Jesteś NaviMind.'));
 assert.equal(reads.length,2);assert.equal(reads[1].messages.at(-1).content.some(p=>p.type==='text'&&p.text.includes('KANDYDAT')),false);
});


test('readable contract pages with no products do not force an otherwise complete offer into review',()=>{
 const cover=pagesLib.pageReading({page_status:'non_product',positions:[],notes:['Czytelna umowa bez specyfikacji produktów.']},2,1);
 const products=pagesLib.pageReading({page_status:'products',positions:[{...position(),evidence:[{page:2,description:'Wymiary produktu.'}]}],notes:[]},2,2);
 const report=pagesLib.mergePageReadings([{page:1,primary:cover,independent:cover},{page:2,primary:products,independent:products}],2);
 assert.equal(report.requires_clarification,false);assert.equal(report.positions.length,1);
 const unreadable=pagesLib.pageReading({page_status:'unreadable',positions:[],notes:['Nieczytelne wymiary.']},2,1);
 const uncertain=pagesLib.mergePageReadings([{page:1,primary:unreadable,independent:unreadable},{page:2,primary:products,independent:products}],2);
 assert.equal(uncertain.requires_clarification,true);
});


test('renderer readiness uses a synthetic probe without a model or executor',async()=>{
 const before=calls;process.env.NAVIMIND_WORKSPACE_MODE='public';assert.equal((await route.GET()).status,403);
 process.env.NAVIMIND_WORKSPACE_MODE='private';const response=await route.GET();assert.equal(response.status,200);assert.equal((await response.json()).ready,true);assert.equal(calls,before);
});
