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
