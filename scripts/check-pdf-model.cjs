// Paid live inference is run only on Vercel and cached by reader/fixture hash.
// All input is generated here. No customer files, keys, or source replies are logged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{
 if(!process.env.VERCEL){console.log('PDF_LIVE_EVAL=skipped_local');return;}
 if(!process.env.OPENAI_API_KEY)throw Error('PDF_LIVE_EVAL_MISSING_MODEL_CONFIGURATION');
 const model=process.env.NAVIMIND_DOCUMENT_MODEL||'gpt-6.1-terra';
 const sources=['app/api/workspace/document-plan/route.ts','app/lib/workspace-document.ts','app/lib/workspace-document-pages.ts','app/lib/window-offer-specification.ts','contracts/window-offer-v1.schema.json','app/lib/workspace-document-directives.ts','app/lib/workspace-pdf-vision.ts',__filename];
 const hash=crypto.createHash('sha256').update(model);for(const file of sources)hash.update(fs.readFileSync(file));
 const key=hash.digest('hex'),directory='.next/cache/navimind-pdf-eval',cache=path.join(directory,key+'.json');
 let previous;try{previous=JSON.parse(fs.readFileSync(cache));}catch{}
 if(previous?.passed&&Date.now()-Date.parse(previous.checked_at)<86400000){console.log('PDF_LIVE_EVAL=verified_cached');return;}
 const {PDFDocument,StandardFonts,degrees}=require('pdf-lib');
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),page=pdf.addPage([842,595]);
 const write=(text,x,y,size=10)=>page.drawText(text,{x,y,size,font});
 function product(x,id,quantity,width,height,opening,profile,inside,outside,panes,ug){
  write('Pos. '+id+'   Stück: '+quantity,x,555,12);
  const bx=x+24,by=345,bw=85,bh=165;
  page.drawRectangle({x:bx,y:by,width:bw,height:bh,borderWidth:1});page.drawRectangle({x:bx+6,y:by+6,width:bw-12,height:bh-12,borderWidth:1});
  write(String(width)+' mm',bx+15,520);page.drawText(String(height)+' mm',{x:bx-12,y:by+60,size:10,font,rotate:degrees(90)});
  write('Glas 610 x 1810',bx+8,by+100,6);write('DW 1+A',bx+8,by+12,8);
  const lines=['Eingangstür',profile,'Farbe innen: '+inside,'Farbe außen: '+outside,panes+'-fache Verglasung '+(panes===3?'4/16/4/16/4':'4/16/4')+' Ug='+ug,'Ansicht von innen; nach innen öffnend',opening==='DL'?'Dreh Links':'Dreh Rechts','3 Scharniere, Standardzylinder','U der gesamten Konstruktion = 1.3'];
  lines.forEach((line,index)=>write(line,x,305-index*17,10));
 }
 product(35,'17',2,870,2110,'DL','TEST-SYSTEM 80','Weiß','Anthrazit',3,.6);
 product(445,'23',1,1170,2390,'DR','TEST-SYSTEM 70','Weiß','Weiß',2,1.1);
 write('Synthetischer Test. Keine Kundendaten.',35,45,9);
 const data='data:application/pdf;base64,'+Buffer.from(await pdf.save()).toString('base64');
 process.env.NAVIMIND_WORKSPACE_MODE='private';
 const route=require('../.next/server/app/api/workspace/document-plan/route.js').routeModule.userland;
 const instruction='Odczytaj wszystkie pozycje. W pozycji 23 wysokość samych drzwi to 2350 mm; dodatkowe 40 mm to osobna listwa transportowa.';
 const response=await route.POST(new Request('https://fixture.invalid/api/workspace/document-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:instruction,history:[],pdf:data})}));
 const body=await response.json();
 if(response.status!==200)throw Error('PDF_LIVE_EVAL_REQUEST_FAILED '+body.stage+' '+body.code);
 const report=body.specification,rows=new Map(report.positions.map(p=>[String(Number(p.source_id??p.id)),p]));
 const failures=[];const expect=(ok,label)=>{if(!ok)failures.push(label);};
 expect(rows.size===2&&report.positions.length===2,'position_ids');
 const color=s=>/anthra|antracyt/i.test(s||'')?'anthracite':/white|weiß|weiss|biały|bialy/i.test(s||'')?'white':'unknown';
 for(const [id,quantity,width,height,opening,profile,outside,panes,ug] of [['17',2,870,2110,'DL','TESTSYSTEM80','anthracite',3,.6],['23',1,1170,2350,'DR','TESTSYSTEM70','white',2,1.1]]){
  const p=rows.get(id);if(!p){failures.push('missing_'+id);continue;}
  expect(p.quantity===quantity,id+'_quantity');expect(p.width_mm===width,id+'_width');expect(p.height_mm===height,id+'_height');
  expect(p.kind==='entrance_door',id+'_kind');expect(p.opening===opening,id+'_opening');expect(p.glazing_panes===panes,id+'_panes');expect(p.ug===ug,id+'_ug');
  expect(color(p.color_inside)==='white'&&color(p.color_outside)===outside,id+'_colors');
  expect((p.profile_reference||'').toUpperCase().replace(/[^A-Z0-9]/g,'').includes(profile),id+'_profile');
 }
 expect(rows.get('17')?.transport_extension_mm===null,'unrelated_transport_unchanged');
 expect(rows.get('23')?.transport_extension_mm===40,'target_transport');
 expect(report.user_corrections?.some(c=>String(Number(c.source_id))==='23'&&c.field==='height_mm'&&c.before===2390&&c.value===2350),'source_height_before_override');
 const core=new Set(['positions','width_mm','height_mm','opening','glazing_panes','ug','color_inside','color_outside','quantity','kind']);
 expect(!report.reading_audit.issues.some(i=>core.has(i.field)),'independent_reading_core_agreement');
 expect(report.executed===false&&!body.task,'read_only');
 if(failures.length)throw Error('PDF_LIVE_EVAL_FIELDS_FAILED '+failures.join(','));
 fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(cache,JSON.stringify({passed:true,model,models_used:report.models_used,checked_at:new Date().toISOString()}));
 console.log('PDF_LIVE_EVAL=verified MODEL='+report.models_used.join(',')+' POSITIONS=2 SOURCE_AND_CORRECTION=verified');
})().catch(error=>{console.error(String(error.message).slice(0,1000));process.exitCode=1;});
