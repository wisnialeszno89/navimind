const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(relative,mocks={}){const file=path.resolve(__dirname,'..',relative),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const native=m.require.bind(m);m.require=name=>Object.hasOwn(mocks,name)?mocks[name]:native(name);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);return m.exports;}
const lib=load('app/lib/workspace-document.ts'),pages=load('app/lib/workspace-document-pages.ts',{'./workspace-document':lib}),d=load('app/lib/workspace-document-directives.ts');
function p(id,height,page=1){return {id,quantity:1,kind:'entrance_door',width_mm:900,height_mm:height,transport_extension_mm:null,opening:'DL',color_inside:'white',color_outside:'white',glazing_panes:3,ug:.6,profile_reference:'TEST',requirements:[],evidence:[{page,description:'Wymiar wysokości '+height+' mm.'}],ambiguities:[]};}
function report(positions,page=1){return pages.pageReading({page_status:'products',positions,notes:[]},2,page);}
const quote='W pozycji 3 wysokość samych drzwi 2050 mm, listwa transportowa 30 mm.';
const values={corrections:[{position_id:'3',field:'height_mm',value:2050,quote},{position_id:'3',field:'transport_extension_mm',value:30,quote}],unresolved:[]};
test('a source-position correction never changes a different product or erases source evidence',()=>{
 const a=report([p('1',2150),p('3',2080)]),cover=pages.pageReading({page_status:'non_product',positions:[],notes:[]},2,2);
 const base=pages.mergePageReadings([{page:1,primary:a,independent:a},{page:2,primary:cover,independent:cover}],2),original=JSON.stringify(base);
 const result=d.applyMeasurementDirectives(base,values,quote);
 assert.deepEqual(result.positions.map(p=>p.height_mm),[2150,2050]);assert.equal(result.positions[0].transport_extension_mm,null);assert.equal(result.positions[1].transport_extension_mm,30);
 assert.match(result.positions[1].evidence[0].description,/2080/);assert.equal(result.user_corrections[0].before,2080);assert.equal(JSON.stringify(base),original);
});
test('ambiguous duplicate source numbers keep both records unchanged and request review',()=>{
 const a=report([p('3',2080)]),b=report([p('3',2310,2)],2);
 const base=pages.mergePageReadings([{page:1,primary:a,independent:a},{page:2,primary:b,independent:b}],2);
 const result=d.applyMeasurementDirectives(base,values,quote);assert.deepEqual(result.positions.map(p=>p.height_mm),[2080,2310]);assert.equal(result.user_corrections.length,0);assert.equal(result.requires_clarification,true);
});
test('invented quotes, position targets and values cannot authorize a measurement change',()=>{
 const a=report([p('3',2080)]),base={...a,reading_audit:{status:'confirmed',issues:[]},page_inventory:[],reading_pipeline:'raster_zoom_independent'};
 for(const change of [{quote:'invented'},{position_id:'1'},{value:9999},{field:'glazing_panes'}])assert.throws(()=>d.applyMeasurementDirectives(base,{corrections:[{...values.corrections[0],...change}],unresolved:[]},quote));
});
