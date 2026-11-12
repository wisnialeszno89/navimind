const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const {PDFDocument}=require('pdf-lib');
function load(relative,mocks={}){const filename=path.resolve(__dirname,'..',relative),output=new Module(filename,module);output.filename=filename;output.paths=Module._nodeModulePaths(path.dirname(filename));const native=output.require.bind(output);output.require=name=>Object.hasOwn(mocks,name)?mocks[name]:native(name);output._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);return output.exports;}
const lib=load('app/lib/workspace-document.ts'),workspace=load('app/lib/workspace.ts'),images=load('app/lib/workspace-image.ts');
let calls=0,lastInput,answer;
class OpenAI{chat={completions:{create:async input=>{calls++;lastInput=input;return {choices:[{message:{content:JSON.stringify(answer)}}]};}}};}
const route=load('app/api/workspace/document-plan/route.ts',{'@/lib/workspace-document':lib,'@/lib/workspace':workspace,'@/lib/workspace-image':images,openai:OpenAI,'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{status:init.status||200})}}});
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

test('private route supplies original PDF to the model and creates only a reading report',async()=>{
 process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='synthetic-unit-test-key';
 const data=await pdf();answer={positions:[position()],notes:[]};
 const response=await route.POST(request({message:'Pozycja 3: same drzwi 2050 mm, listwa 30 mm tylko do transportu.',history:[],pdf:data}));
 const body=await response.json();assert.equal(response.status,200);assert.equal(body.specification.executed,false);assert.equal(body.specification.positions[0].height_mm,2050);
 const parts=lastInput.messages.at(-1).content;assert.equal(parts[1].type,'file');assert.equal(parts[1].file.file_data,data);
 assert.match(parts[0].text,/2050/);assert.match(lastInput.messages[0].content,/NIEZAUFANYMI DANYMI/);
 assert.equal(lastInput.model,'gpt-4.1-mini');assert.equal('task' in body,false);
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
