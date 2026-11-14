const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(relative,mocks={}){const file=path.resolve(__dirname,'..',relative),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const native=m.require.bind(m);m.require=name=>Object.hasOwn(mocks,name)?mocks[name]:native(name);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);return m.exports;}
const common=load('app/lib/window-offer-specification.ts'),lib=load('app/lib/offer-conversation.ts',{'./window-offer-specification':common}),example=require('../contracts/window-offer-v1.example.json');
function spec(){const s=structuredClone(example);s.positions[0].id=s.positions[0].source_id='7';const b=structuredClone(s.positions[0]);b.id=b.source_id='9';b.width_mm=900;b.height_mm=800;s.positions.push(b);return s;}
const change=(quote,extra={})=>({selector:'id',target:'9',field:'width_mm',operation:'set',value:1230,quote,...extra});
const turn=changes=>lib.offerDecision({intent:'correct',reply:'Sprawdzam poprawkę.',changes});
function apply(s,changes,instruction=changes.map(c=>c.quote).join('\n')){return lib.correctOffer(s,turn(changes),turn(changes),instruction);}
test('source number and table order resolve the intended row; repeated edits retain the original source',()=>{
 const s=spec(),before=JSON.stringify(s),q='W drugiej pozycji zmień szerokość na 1230 mm.';
 const a=apply(s,[change(q,{selector:'ordinal',target:'2'})]);
 assert.equal(a.specification.positions[1].width_mm,1230);assert.deepEqual(a.specification.positions[0],s.positions[0]);assert.equal(JSON.stringify(s),before);
 const b=apply(a.specification,[change('Pozycja 9: szerokość 125 cm.',{value:1250})]);
 assert.equal(b.specification.positions[1].width_mm,1250);assert.equal(b.specification.corrections.length,1);assert.equal(b.specification.corrections[0].before,900);assert.equal(b.specification.corrections[0].value,1250);
 assert.equal(b.specification.corrections[0].quote,'Pozycja 9: szerokość 125 cm.');assert.deepEqual(b.specification.source,s.source);assert.equal(b.specification.positions[1].height_mm,800);
});
test('relative millimetres use the current value; transport stays separate from product height',()=>{
 const s=spec(),q='Pozycja 9: poszerz o 2 cm i dodaj osobną listwę transportową 30 mm.';
 const a=apply(s,[change(q,{operation:'add',value:20}),change(q,{field:'transport_extension_mm',value:30})]);
 assert.equal(a.specification.positions[1].width_mm,920);assert.equal(a.specification.positions[1].height_mm,800);assert.equal(a.specification.positions[1].transport_extension_mm,30);
});
test('all positions are explicit and only means a genuinely single-position specification',()=>{
 const s=spec(),q='Wszystkim pozycjom ustaw wysokość 1200 mm.';
 assert.deepEqual(apply(s,[change(q,{selector:'all',target:'',field:'height_mm',value:1200})]).specification.positions.map(p=>p.height_mm),[1200,1200]);
 assert.throws(()=>apply(s,[change('Zmień szerokość na 1230 mm.',{selector:'only',target:''})]),/Której pozycji/);
 const one=structuredClone(example);assert.equal(apply(one,[change('Zmień szerokość na 1000 mm.',{selector:'only',target:'',value:1000})]).specification.positions[0].width_mm,1000);
});
test('unquoted numbers, unit-free measures, invalid selectors and negative results are atomic failures',()=>{
 for(const c of [change('Pozycja 9: szerokość 999 mm.'),change('Pozycja 9: szerokość 1230.'),change('Pozycja 9: szerokość 1230 mm.',{target:'7'}),change('Pozycja 9: odejmij 1230 mm.',{operation:'subtract'})]){
  const s=spec(),before=JSON.stringify(s);assert.throws(()=>apply(s,[change('Pozycja 7: szerokość 1000 mm.',{target:'7',value:1000}),c]));assert.equal(JSON.stringify(s),before);
 }
 const s=spec();assert.throws(()=>apply(s,[change('Pozycja 9: szerokość 1230 mm.')],'Inna wiadomość.'),/Cytat/);
});
test('independent interpretation disagreements and duplicate source numbers cannot change the spec',()=>{
 const s=spec(),q='Pozycja 9: szerokość 1230 mm. Pozycja 7: szerokość 1230 mm.';
 assert.throws(()=>lib.correctOffer(s,turn([change(q)]),turn([change(q,{target:'7'})]),q),/Dwa odczyty/);
 s.positions[0].source_id='9';assert.throws(()=>apply(s,[change('Pozycja 9: szerokość 1230 mm.')]),/jednej pozycji/);
});
test('explicit confirmation resolves only its own numeric audit conflict',()=>{
 const s=spec();s.requires_clarification=true;s.positions[1].field_status.width_mm='conflict';s.positions[0].field_status.quantity='conflict';
 s.audit_issues=[{position_id:'9',page:null,field:'width_mm',reason:'900 / 1000'},{position_id:'7',page:null,field:'quantity',reason:'2 / 3'}];
 const a=apply(s,[change('Pozycja 9: potwierdzam szerokość 900 mm.',{value:900})]).specification;
 assert.equal(a.positions[1].field_status.width_mm,'corrected');assert.equal(a.audit_issues.length,1);assert.equal(a.audit_issues[0].position_id,'7');assert.equal(a.requires_clarification,true);
 const b=structuredClone(s);b.audit_issues=b.audit_issues.slice(0,1);b.positions[0].field_status.quantity='reported';assert.equal(apply(b,[change('Pozycja 9: szerokość 1000 mm.',{value:1000})]).specification.requires_clarification,false);
});
test('unknown correction fields and malformed pending contexts are rejected',()=>{
 assert.throws(()=>turn([change('Pozycja 9: ilość 2 szt.',{field:'quantity'})]),/INVALID/);
 assert.throws(()=>lib.offerDecision({intent:'reply',reply:'Opis',changes:[change('x')]}),/INCONSISTENT_OFFER_INTENT/);
 assert.throws(()=>lib.offerPending({request:'x',question:'y',extra:true}),/INVALID/);
});
let inputs=[],decisions=[],failure=null;
class OpenAI{chat={completions:{create:async input=>{inputs.push(input);if(failure)throw Error('provider unavailable');return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(decisions.shift())}}]};}}};}
const route=load('app/api/workspace/offer-turn/route.ts',{'openai':OpenAI,'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{status:init.status||200,headers:init.headers})}},'@/lib/workspace':load('app/lib/workspace.ts'),'@/lib/workspace-image':load('app/lib/workspace-image.ts'),'@/lib/browser-model':load('app/lib/browser-model.ts'),'@/lib/window-offer-specification':common,'@/lib/offer-conversation':lib});
const req=body=>new Request('https://fixture.invalid/api/workspace/offer-turn',{method:'POST',body:JSON.stringify(body)});
test('the route preserves pending questions during discussion and accepts a short position answer',async()=>{
 const oldMode=process.env.NAVIMIND_WORKSPACE_MODE,oldKey=process.env.OPENAI_API_KEY;process.env.NAVIMIND_WORKSPACE_MODE='private';process.env.OPENAI_API_KEY='test-fixture';inputs=[];
 try{
  const s=spec(),pending={request:'Zmień szerokość na 1230 mm.',question:'Która pozycja?'},before=JSON.stringify(s);
  decisions=[{intent:'reply',reply:'DKR oznacza rozwierno-uchylne prawe.',changes:[]}];
  const discussion=await (await route.POST(req({message:'Co oznacza DKR?',specification:s,pending}))).json();
  assert.deepEqual(discussion.pending,pending);assert.equal('offerSpecification' in discussion,false);assert.equal(inputs.length,1);
  const q=pending.request+'\nPozycja 9';decisions=[turn([change(q)]),turn([change(q)])];
  const response=await route.POST(req({message:'Pozycja 9',specification:s,pending})),body=await response.json();
  assert.equal(response.status,200);assert.equal(body.intent,'correct');assert.equal(body.offerSpecification.positions[1].width_mm,1230);assert.equal(body.pending,null);assert.equal('task' in body,false);assert.equal(inputs.length,3);assert.equal(JSON.stringify(s),before);
  decisions=[{intent:'cancel',reply:'Odwołałem oczekującą poprawkę.',changes:[]}];const cancel=await (await route.POST(req({message:'Anuluj poprawkę',specification:s,pending}))).json();assert.equal(cancel.pending,null);assert.equal(cancel.intent,'cancel');
  failure=true;const failed=await route.POST(req({message:'Pozycja 9: szerokość 1230 mm',specification:s,pending}));assert.equal(failed.status,503);assert.equal(JSON.stringify(s),before);
 }finally{failure=null;if(oldMode===undefined)delete process.env.NAVIMIND_WORKSPACE_MODE;else process.env.NAVIMIND_WORKSPACE_MODE=oldMode;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
test('disabled, invalid and invented execution specifications never invoke the model',async()=>{
 const old=process.env.NAVIMIND_WORKSPACE_MODE,before=inputs.length;delete process.env.NAVIMIND_WORKSPACE_MODE;
 try{assert.equal((await route.POST(req({message:'x'}))).status,403);process.env.NAVIMIND_WORKSPACE_MODE='private';const s=spec();s.executed=true;assert.equal((await route.POST(req({message:'x',specification:s}))).status,400);assert.equal(inputs.length,before);}finally{if(old===undefined)delete process.env.NAVIMIND_WORKSPACE_MODE;else process.env.NAVIMIND_WORKSPACE_MODE=old;}
});

test('an empty unused model reply cannot reject an otherwise valid correction',()=>{
 const s=spec(),q='Pozycja 9: szerokość 1230 mm.',decision=lib.offerDecision({intent:'correct',reply:'',changes:[change(q)]});
 assert.equal(lib.correctOffer(s,decision,decision,q).specification.positions[1].width_mm,1230);
 assert.throws(()=>lib.offerDecision({intent:'reply',reply:'',changes:[]}),/INVALID/);
});
