const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(relative,mocks={}){const file=path.resolve(__dirname,'..',relative),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const native=m.require.bind(m);m.require=name=>Object.hasOwn(mocks,name)?mocks[name]:native(name);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,resolveJsonModule:true}}).outputText,file);return m.exports;}
const lib=load('app/lib/workspace-document.ts'),common=load('app/lib/window-offer-specification.ts'),pages=load('app/lib/workspace-document-pages.ts',{'./workspace-document':lib}),enquiry=load('app/lib/window-enquiry.ts',{'./workspace-document':lib});
const example=require('../contracts/window-offer-v1.example.json');
function raw(){const {source_id,source_page,field_status,...p}=structuredClone(example.positions[0]);p.evidence=p.evidence.map(e=>({...e,page:1}));return {positions:[p],notes:[]};}
const source=example.positions[0].evidence[0].description;
test('text and PDF export use the same exact v1 schema without invented text pages',()=>{
 const report=lib.documentReport(raw(),1);
 assert.deepEqual(common.toOfferSpecification(report,example.source),example);
 const pdf=common.toOfferSpecification(report,{...example.source,kind:'pdf',pages:1});
 assert.equal(pdf.positions[0].source_page,1);assert.equal(pdf.positions[0].evidence[0].page,1);
 assert.equal(pdf.schema_version,example.schema_version);assert.equal(pdf.executed,false);
});
for(const [kind,opening,expected] of [['window','R','DKR'],['window','L','DKL'],['entrance_door','R','DR'],['entrance_door','L','DL'],['balcony_door','R','DR'],['balcony_door','L','DL'],['entrance_door','DKR','DKR'],['window','FIX','FIX'],['other','R','R'],['balcony_door','HST','HST']])test(`sales convention ${kind} ${opening} preserves ${expected}`,()=>{
 const report=lib.documentReport({positions:[{...raw().positions[0],kind,opening}],notes:[]},1),before=JSON.stringify(report);
 assert.equal(common.normalizeSalesOpening(report).positions[0].opening,expected);assert.equal(JSON.stringify(report),before);
});
test('evidence invented by the model cannot be exported as a source quotation',()=>{
 assert.throws(()=>enquiry.enquiryReading({...raw(),positions:[{...raw().positions[0],evidence:[{page:1,description:'Not in the source'}]}]},source),/UNGROUNDED/);
 assert.equal(enquiry.enquiryReading(raw(),source).positions.length,1);
});
test('matching source quotes do not validate invented numbers or unit-free dimensions',()=>{
 const invented=raw();invented.positions[0].width_mm=999;
 assert.equal(enquiry.enquiryReading(invented,source).requires_clarification,true);
 const cm=raw(),text='Fenster 2 Stk. 123 x 147,8 cm FIX';cm.positions[0].evidence=[{page:1,description:text}];
 assert.equal(enquiry.enquiryReading(cm,text).requires_clarification,false);
 const unitless=raw(),without='Fenster 2 Stk. 1230x1478 FIX';unitless.positions[0].evidence=[{page:1,description:without}];
 assert.equal(enquiry.enquiryReading(unitless,without).requires_clarification,true);
});
test('unknown values, duplicate positions, false execution flags and concealed conflicts are rejected',()=>{
 for(const change of [s=>s.executed=true,s=>s.positions.push(s.positions[0]),s=>s.positions[0].width_mm=null,s=>s.positions[0].field_status.width_mm='corrected',s=>s.positions[0].unexpected='silently dropped',s=>s.source.pages=2,s=>s.positions[0].field_status.opening='conflict']){
  const spec=structuredClone(example);change(spec);assert.throws(()=>common.offerSpecification(spec));
 }
});
test('independent field conflicts and the original value survive export',()=>{
 const a=enquiry.enquiryReading(raw(),source),b=enquiry.enquiryReading({positions:[{...raw().positions[0],width_mm:999}],notes:[]},source);
 const report=pages.mergePageReadings([{page:1,primary:a,independent:b}],1),spec=common.toOfferSpecification(report,example.source);
 assert.equal(spec.positions[0].width_mm,1230);assert.equal(spec.requires_clarification,true);assert.equal(spec.positions[0].field_status.width_mm,'conflict');assert.equal(spec.audit_issues[0].page,null);
});
let inputs=[],independent=null;
class OpenAI{chat={completions:{create:async input=>{inputs.push(input);return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(input.messages[0].content.includes('To niezależny')?(independent||raw()):raw())}}]};}}};}
const route=load('app/api/workspace/enquiry-plan/route.ts',{'openai':OpenAI,'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{status:init.status||200,headers:init.headers})}},'@/lib/workspace':load('app/lib/workspace.ts'),'@/lib/workspace-image':load('app/lib/workspace-image.ts'),'@/lib/workspace-document':lib,'@/lib/workspace-document-pages':pages,'@/lib/window-offer-specification':common,'@/lib/window-enquiry':enquiry});
const request=body=>new Request('https://test.invalid/api/workspace/enquiry-plan',{method:'POST',body:JSON.stringify(body)});
test('the text route exports the actual source and uses no history or executor',async()=>{
 const previous={mode:process.env.NAVIMIND_WORKSPACE_MODE,key:process.env.OPENAI_API_KEY};process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='test-fixture';inputs=[];
 try{
  const response=await route.POST(request({message:source,history:[{role:'assistant',content:'OLD_DOOR_9999'}]})),body=await response.json();
  assert.equal(response.status,200);assert.deepEqual(body.offerSpecification,example);assert.equal('task' in body,false);assert.equal(body.agentConnected,false);assert.equal(inputs.length,2);
  for(const input of inputs){assert.equal(input.messages.length,2);assert.equal(input.messages[1].content,source);assert.ok(!JSON.stringify(input).includes('OLD_DOOR'));}
  independent={positions:[{...raw().positions[0],quantity:3}],notes:[]};
  const checked=await (await route.POST(request({message:source,history:[]}))).json();assert.equal(checked.offerSpecification.requires_clarification,true);assert.equal(checked.offerSpecification.positions[0].quantity,2);assert.match(checked.reply,/Do wyjaśnienia — pozycja 1, ilość/);assert.match(checked.reply,/2 \/ 3/);
 }finally{independent=null;if(previous.mode===undefined)delete process.env.NAVIMIND_WORKSPACE_MODE;else process.env.NAVIMIND_WORKSPACE_MODE=previous.mode;if(previous.key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous.key;}
});
test('disabled and invalid requests cannot invoke the model',async()=>{
 const before=inputs.length,mode=process.env.NAVIMIND_WORKSPACE_MODE;delete process.env.NAVIMIND_WORKSPACE_MODE;
 try{assert.equal((await route.POST(request({message:source}))).status,403);process.env.NAVIMIND_WORKSPACE_MODE='private';assert.equal((await route.POST(request({message:'x'.repeat(8001)}))).status,400);assert.equal((await route.POST(request({message:source,image:'data'}))).status,400);assert.equal(inputs.length,before);}finally{if(mode===undefined)delete process.env.NAVIMIND_WORKSPACE_MODE;else process.env.NAVIMIND_WORKSPACE_MODE=mode;}
});

test('text enquiry explains scoped equipment disagreements in the visible reply',()=>{
 const a=lib.documentReport({positions:[{...raw().positions[0],requirements:['Elektrozaczep 12 V']}],notes:[]},1);
 const b=lib.documentReport({positions:[{...raw().positions[0],requirements:['Bez elektrozaczepu']}],notes:[]},1);
 const report=pages.mergePageReadings([{page:1,primary:a,independent:b}],1);
 const spec=common.toOfferSpecification(report,example.source),before=JSON.stringify(spec),reply=enquiry.enquiryReply(spec);
 assert.match(reply,/Do wyjaśnienia — pozycja 1, wyposażenie/);
 assert.match(reply,/pierwszy odczyt: Elektrozaczep 12 V/);
 assert.match(reply,/drugi odczyt: Bez elektrozaczepu/);
 assert.equal(JSON.stringify(spec),before);
});
