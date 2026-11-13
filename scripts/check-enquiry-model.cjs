// Generated enquiries only. No client data, credentials or source replies logged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{
 if(!process.env.VERCEL){console.log('ENQUIRY_LIVE_EVAL=skipped_local');return;}
 if(!process.env.OPENAI_API_KEY)throw Error('ENQUIRY_LIVE_EVAL_MISSING_CONFIGURATION');
 const model=process.env.NAVIMIND_ENQUIRY_MODEL||process.env.NAVIMIND_DOCUMENT_MODEL||'gpt-6.1-terra';
 const files=['app/api/workspace/enquiry-plan/route.ts','app/lib/window-enquiry.ts','app/lib/window-offer-specification.ts','app/lib/workspace-document.ts','app/lib/workspace-document-pages.ts','contracts/window-offer-v1.schema.json',__filename];
 const hash=crypto.createHash('sha256').update(model);for(const file of files)hash.update(fs.readFileSync(file));
 const cache=path.join('.next/cache/navimind-enquiry-eval',hash.digest('hex')+'.json');
 let previous;try{previous=JSON.parse(fs.readFileSync(cache));}catch{}
 if(previous?.passed&&Date.now()-Date.parse(previous.checked_at)<86400000){console.log('ENQUIRY_LIVE_EVAL=verified_cached');return;}
 process.env.NAVIMIND_WORKSPACE_MODE='private';
 const route=require('../.next/server/app/api/workspace/enquiry-plan/route.js').routeModule.userland;
 const cases=[
  {name:'de_numbered_cm',text:'Pos. 7: 2 Stück Fenster, 123 x 147,8 cm, R; innen weiß, außen anthrazit. Profil: TEST-Profil X.\nPos. 9: 1 Stück Haustür, Breite 990 mm, Höhe 2120 mm, L. Farbe beidseitig weiß. Elektrotüröffner nur an Pos. 9.',rows:[['7','window',2,1230,1478,'DKR'],['9','entrance_door',1,990,2120,'DL']],strike:'9'},
  {name:'pl_product_opening',text:'Poz. 3: okno, 2 szt., szerokość 1230 mm, wysokość 1478 mm, L; wewnątrz biały, na zewnątrz antracyt.\nPoz. 4: drzwi wejściowe, 1 szt., 990 × 2120 mm, R, białe dwustronnie. Tylko pozycja 4: elektrozaczep.\nPoz. 6: drzwi balkonowe DKR, 1 szt., 900 × 2100 mm, białe dwustronnie.',rows:[['3','window',2,1230,1478,'DKL'],['4','entrance_door',1,990,2120,'DR'],['6','balcony_door',1,900,2100,'DKR']],strike:'4'},
  {name:'ambiguous_quantity',text:'Poz. 5: okno 1200 × 1400 mm R, 2 szt. lub 3 szt. Kolor biały/antracyt, nie podano stron.',rows:[['5','window',null,1200,1400,'DKR']],review:true},
 ];
 for(const c of cases){
  const response=await route.POST(new Request('https://fixture.invalid/api/workspace/enquiry-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:c.text,history:[]})}));
  const body=await response.json();if(response.status!==200)throw Error('ENQUIRY_LIVE_EVAL_REQUEST_FAILED '+c.name);
  const spec=body.offerSpecification,rows=new Map(spec.positions.map(p=>[String(Number(p.source_id)),p])),failures=[];
  if(rows.size!==c.rows.length||spec.positions.length!==c.rows.length)failures.push('position_count');
  for(const [id,kind,quantity,width,height,opening] of c.rows){
   const p=rows.get(id);if(!p){failures.push('missing_'+id);continue;}
   for(const [field,expected] of Object.entries({kind,quantity,width_mm:width,height_mm:height,opening}))if(p[field]!==expected)failures.push(id+'_'+field);
   if(c.strike){const has=/elektro.*(?:zaczep|öffner|oeffner)|electric.*strike/i.test(p.requirements.join(' '));if(has!==(id===c.strike))failures.push(id+'_equipment_scope');}
  }
  if(c.review&&!spec.requires_clarification)failures.push('ambiguity');
  if(spec.source.kind!=='text'||spec.executed!==false||!spec.sales_review_required||body.task)failures.push('read_only');
  if(failures.length)throw Error('ENQUIRY_LIVE_EVAL_FIELDS_FAILED '+c.name+' '+failures.join(','));
  console.log('ENQUIRY_CASE=verified NAME='+c.name+' POSITIONS='+c.rows.length);
 }
 fs.mkdirSync(path.dirname(cache),{recursive:true});fs.writeFileSync(cache,JSON.stringify({passed:true,model,checked_at:new Date().toISOString()}));
 console.log('ENQUIRY_LIVE_EVAL=verified CASES=3 POSITIONS=6');
})().catch(error=>{console.error(String(error.message).slice(0,500));process.exitCode=1;});
