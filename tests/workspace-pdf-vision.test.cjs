const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),sharp=require('sharp');
const {PDFDocument,rgb}=require('pdf-lib');
const filename=path.resolve(__dirname,'../app/lib/workspace-pdf-vision.ts'),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const lib=m.exports;
require('node:child_process').execFileSync(process.execPath,['scripts/prepare-pdf-runtime.mjs'],{stdio:'pipe'});
test('real renderer turns synthetic PDF content into pixels; rotation and zoom retain geometry',async()=>{
 const doc=await PDFDocument.create();const page=doc.addPage([200,100]);page.drawRectangle({x:0,y:0,width:100,height:100,color:rgb(1,0,0)});page.drawRectangle({x:100,y:0,width:100,height:100,color:rgb(0,0,1)});
 const data='data:application/pdf;base64,'+Buffer.from(await doc.save()).toString('base64');
 const rasters=await lib.rasterPDF(data,1);assert.equal(rasters.length,1);assert.equal(rasters[0].width,600);assert.equal(rasters[0].height,300);
 const views=await lib.pdfPageViews(rasters[0],90);assert.equal(views.width,300);assert.equal(views.height,600);assert.equal(views.images.length,3);
 const top=await sharp(views.images[1].image).stats(),bottom=await sharp(views.images[2].image).stats();
 assert.ok(top.channels[0].mean>top.channels[2].mean);assert.ok(bottom.channels[2].mean>bottom.channels[0].mean);
 await assert.rejects(lib.pdfPageViews(rasters[0],13),/INVALID_PAGE_ORIENTATION/);
 await assert.rejects(lib.rasterPDF(data,2),/PDF_RENDER_PAGE_MISMATCH/);
});


test('renderer works when the caller is evaluated in a VM without an import callback',async()=>{
 const vm=require('node:vm');const doc=await PDFDocument.create();doc.addPage([160,120]);
 const data='data:application/pdf;base64,'+Buffer.from(await doc.save()).toString('base64');
 const sandboxModule={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{module:sandboxModule,exports:sandboxModule.exports,require:Module.createRequire(filename),process,Buffer,console,Uint8Array,ArrayBuffer,setTimeout,clearTimeout},{filename});
 const result=await sandboxModule.exports.rasterPDF(data,1);assert.equal(result.length,1);assert.equal(result[0].width,480);
});

test('synthetic readiness checks image rendering without customer data',async()=>{
 assert.deepEqual(await lib.pdfRendererProbe(),{pages:1,views:3});
});
