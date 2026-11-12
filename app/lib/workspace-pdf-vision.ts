import {join} from 'path';
import {existsSync} from 'fs';
import sharp from 'sharp';
import * as canvasRuntime from '@napi-rs/canvas';
import {PDFDocument} from 'pdf-lib';

// Keep the ESM renderer outside the Next server bundle, with its copied worker assets and
// native canvas included in the function trace (next.config.js).
type NodeModuleAccess={createRequire:(filename:string)=>(id:string)=>{load:()=>Promise<any>}};
function loadRuntime(root:string){
 if(!existsSync(join(root,'loader.cjs'))||!existsSync(join(root,'legacy/build/pdf.mjs')))throw Error('PDF_RENDER_ASSETS_MISSING');
 // A real CommonJS file owns the import callback. new Function(import(...))
 // inherits the caller's VM context and can fail in hosted function runtimes.
 const nativeModule=(process as unknown as {getBuiltinModule:(name:string)=>NodeModuleAccess}).getBuiltinModule('module');
 return nativeModule.createRequire(join(root,'loader.cjs'))(join(root,'loader.cjs')).load();
}
export type PDFRaster={page:number;image:Buffer;width:number;height:number};
export async function rasterPDF(data:string,expectedPages:number):Promise<PDFRaster[]>{
 if(typeof canvasRuntime.createCanvas!=='function')throw Error('PDF_RENDER_DEPENDENCY');
 const root=join(process.cwd(),'pdf-runtime');
 const {getDocument}=await loadRuntime(root);
 const task=getDocument({data:new Uint8Array(Buffer.from(data.split(',')[1],'base64')),isEvalSupported:false,stopAtErrors:true,
  cMapUrl:join(root,'cmaps/'),cMapPacked:true,standardFontDataUrl:join(root,'standard_fonts/'),wasmUrl:join(root,'wasm/'),verbosity:0});
 try{
  const doc=await task.promise;
  if(doc.numPages!==expectedPages)throw Error('PDF_RENDER_PAGE_MISMATCH');
  const pages:PDFRaster[]=[];
  for(let index=1;index<=doc.numPages;index++){
   const page=await doc.getPage(index);
   const base=page.getViewport({scale:1});
   const scale=Math.min(3,2400/Math.max(base.width,base.height));
   const viewport=page.getViewport({scale});
   if(!Number.isFinite(viewport.width)||!Number.isFinite(viewport.height)||viewport.width<1||viewport.height<1)throw Error('PDF_RENDER_GEOMETRY');
   const target=doc.canvasFactory.create(Math.ceil(viewport.width),Math.ceil(viewport.height));
   try{
    await page.render({canvasContext:target.context,viewport}).promise;
    pages.push({page:index,image:target.canvas.toBuffer('image/png'),width:target.canvas.width,height:target.canvas.height});
   }finally{doc.canvasFactory.destroy(target);page.cleanup();}
  }
  return pages;
 }finally{await task.destroy();}
}
export async function pdfPageViews(page:PDFRaster,rotation:number){
 if(![0,90,180,270].includes(rotation))throw Error('INVALID_PAGE_ORIENTATION');
 const upright=await sharp(page.image,{limitInputPixels:6000000}).rotate(rotation).png().toBuffer({resolveWithObject:true});
 const {width,height}=upright.info;
 // Overlap prevents a center label being lost. Full view provides context and
 // halves are evidence zooms of the same page, never additional products.
 const w=Math.ceil(width*.56),h=Math.ceil(height*.56);
 const regions=[{left:0,top:0,width:w,height:h},{left:width-w,top:0,width:w,height:h},{left:0,top:height-h,width:w,height:h},{left:width-w,top:height-h,width:w,height:h}];
 const labels=['górna lewa część','górna prawa część','dolna lewa część','dolna prawa część'];
 const images=[{label:'cała strona',image:await sharp(upright.data).jpeg({quality:95}).toBuffer()}];
 for(let i=0;i<regions.length;i++)images.push({label:labels[i],image:await sharp(upright.data).extract(regions[i]).jpeg({quality:97}).toBuffer()});
 return {page:page.page,width,height,images};
}


// A generated image PDF, not customer data. Used to check the actual packaged
// function without calling a model or accessing any Windows executor.
export async function pdfRendererProbe(){
 const sample=await sharp({create:{width:80,height:60,channels:3,background:{r:230,g:30,b:20}}}).jpeg().toBuffer();
 const pdf=await PDFDocument.create(),page=pdf.addPage();page.setSize(160,120);
 page.drawImage(await pdf.embedJpg(sample),{x:0,y:0,width:160,height:120});
 page.drawText('NaviMind PDF',{x:10,y:60,size:12});
 const rasters=await rasterPDF('data:application/pdf;base64,'+Buffer.from(await pdf.save()).toString('base64'),1);
 const views=await pdfPageViews(rasters[0],0);
 const stats=await sharp(rasters[0].image).stats();
 if(rasters.length!==1||views.images.length!==5||stats.channels[0].mean<stats.channels[1].mean+50)throw Error('PDF_RENDER_PROBE_FAILED');
 return {pages:1,views:5};
}
