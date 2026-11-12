import {join} from 'path';
import {pathToFileURL} from 'url';
import sharp from 'sharp';

// Keep the ESM renderer outside the Next server bundle, with its worker and
// native canvas explicitly included in the function trace (next.config.js).
const importModule=new Function('specifier','return import(specifier)') as (specifier:string)=>Promise<any>;
export type PDFRaster={page:number;image:Buffer;width:number;height:number};
export async function rasterPDF(data:string,expectedPages:number):Promise<PDFRaster[]>{
 const root=join(process.cwd(),'node_modules/pdfjs-dist');
 const {getDocument}=await importModule(pathToFileURL(join(root,'legacy/build/pdf.mjs')).href);
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
 const horizontal=width>height;
 const extent=Math.ceil((horizontal?width:height)*.56);
 const regions=horizontal?
  [{left:0,top:0,width:extent,height},{left:width-extent,top:0,width:extent,height}]:
  [{left:0,top:0,width,height:extent},{left:0,top:height-extent,width,height:extent}];
 const images=[{label:'cała strona',image:await sharp(upright.data).jpeg({quality:93}).toBuffer()}];
 for(let i=0;i<regions.length;i++)images.push({label:horizontal?(i?'prawa część':'lewa część'):(i?'dolna część':'górna część'),image:await sharp(upright.data).extract(regions[i]).jpeg({quality:95}).toBuffer()});
 return {page:page.page,width,height,images};
}
