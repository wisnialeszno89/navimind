// Exercise the actual TypeScript export and the pinned Python preparation adapter.
// No model calls, browser actions or customer data are used by this check.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto'),os=require('node:os'),{spawnSync}=require('node:child_process'),assert=require('node:assert/strict'),ts=require('typescript');
const executor=path.resolve(process.argv[2]||'.executor-contract');
const pin=require('../contracts/browser-regression-executor.json');
const revision=spawnSync('git',['rev-parse','HEAD'],{cwd:executor,encoding:'utf8'});
if(revision.status!==0||revision.stdout.trim()!==pin.commit)throw Error('OFFER_EXECUTOR_REVISION_MISMATCH');
for(const file of ['window-offer-v1.schema.json','window-offer-v1.example.json']){
 if(!fs.readFileSync(path.join('contracts',file)).equals(fs.readFileSync(path.join(executor,'contracts',file))))throw Error('OFFER_CONTRACT_DRIFT:'+file);
}
function load(file,mocks={}){file=path.resolve(file);const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const native=m.require.bind(m);m.require=name=>Object.hasOwn(mocks,name)?mocks[name]:native(name);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);return m.exports;}
const document=load('app/lib/workspace-document.ts'),common=load('app/lib/window-offer-specification.ts');
const example=require('../contracts/window-offer-v1.example.json');
function position(id,width,height,quantity){
 const {source_id,source_page,field_status,...p}=structuredClone(example.positions[0]);
 return {...p,id,width_mm:width,height_mm:height,quantity,evidence:[{page:1,description:`Fenster ${quantity} Stk. ${width}x${height} mm FIX; Okna PVC Premium Line (Salamander); Weiss/weiss`}]};
}
const report=document.documentReport({positions:[position('1',1230,1478,2),position('2',900,800,3)],notes:[]},1);
const source={kind:'text',pages:null,sha256:crypto.createHash('sha256').update(report.positions.map(p=>p.evidence[0].description).join('\n')).digest('hex')};
const ready=common.toOfferSpecification(report,source);
const blockedReport=structuredClone(report);blockedReport.positions[1].requirements=['Moskitiera tylko w pozycji 2'];
const blocked=common.toOfferSpecification(blockedReport,source);
const pdf=common.toOfferSpecification(report,{...source,kind:'pdf',pages:1});
const conversation=load('app/lib/offer-conversation.ts',{'./window-offer-specification':common});
let corrected=ready;
for(const value of [1230,1250]){
 const quote=`Pozycja 2: ustaw szerokość ${value} mm.`,decision={intent:'correct',reply:'Sprawdzam.',changes:[{selector:'id',target:'2',field:'width_mm',operation:'set',value,quote}]};
 corrected=conversation.correctOffer(corrected,decision,decision,quote).specification;
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'navimind-offer-boundary-'));
try{
 const input=path.join(dir,'exports.json');fs.writeFileSync(input,JSON.stringify({ready,blocked,pdf,corrected}));
 const result=spawnSync(process.env.OFFER_BOUNDARY_PYTHON||'python',['-c',`
import json, sys
from pathlib import Path
from app.agent.intake.window_offer_specification import validate_offer_specification, prepare_pagen_specification
exports = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
for spec in exports.values():
    validate_offer_specification(spec)
ready = prepare_pagen_specification(exports['ready'])
assert ready['status'] == 'ready_for_form', ready
assert ready['source_positions'] == ['1', '2'], ready
assert [(p['width_mm'], p['height_mm'], p['quantity']) for p in ready['order']['positions']] == [(1230,1478,2),(900,800,3)], ready
assert ready['submitted'] is False and ready['wh_offer_created'] is False, ready
assert prepare_pagen_specification(exports['pdf'])['status'] == 'ready_for_form'
corrected = prepare_pagen_specification(exports['corrected'])
assert corrected['status'] == 'ready_for_form', corrected
assert corrected['order']['positions'][1]['width_mm'] == 1250, corrected
assert exports['corrected']['corrections'][0]['before'] == 900
assert len(exports['corrected']['corrections']) == 1
assert exports['corrected']['source'] == exports['ready']['source']
blocked = prepare_pagen_specification(exports['blocked'])
assert blocked['status'] == 'review' and blocked['order'] is None, blocked
assert any(i['position_id'] == '2' and i['field'] == 'requirements' for i in blocked['issues']), blocked
print('OFFER_EXECUTOR_BOUNDARY=verified POSITIONS=2 TEXT=True PDF=True REPEATED_CORRECTIONS=True UNSUPPORTED_ORDER=blocked NO_ACTIONS=True')
`,input],{cwd:executor,encoding:'utf8'});
 if(result.error)throw result.error;
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 assert.equal(result.status,0,'Python rejected the actual TypeScript exporter output');
 console.log('OFFER_EXECUTOR_COMMIT='+pin.commit);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
