// Generated specifications and instructions only; no desktop or customer data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
(async()=>{
 if(!process.env.VERCEL){console.log('OFFER_CONVERSATION=skipped_local');return;}
 if(!process.env.OPENAI_API_KEY)throw Error('OFFER_CONVERSATION_MISSING_CONFIGURATION');
 const model=process.env.NAVIMIND_BROWSER_MODEL||'gpt-5.4',hash=crypto.createHash('sha256').update(model);
 for(const f of ['app/api/workspace/offer-turn/route.ts','app/lib/offer-conversation.ts','app/lib/window-offer-specification.ts','app/lib/browser-model.ts','contracts/window-offer-v1.schema.json',__filename])hash.update(fs.readFileSync(f));
 const cache=path.join('.next/cache/navimind-offer-conversation',hash.digest('hex')+'.json');
 let previous;try{previous=JSON.parse(fs.readFileSync(cache));}catch{}
 if(previous?.passed&&Date.now()-Date.parse(previous.checked_at)<86400000){console.log('OFFER_CONVERSATION=verified_cached');return;}
 process.env.NAVIMIND_WORKSPACE_MODE='private';
 const route=require('../.next/server/app/api/workspace/offer-turn/route.js').routeModule.userland;
 let specification=structuredClone(require('../contracts/window-offer-v1.example.json')),pending=null,count=0;
 specification.positions[0].id=specification.positions[0].source_id='7';
 const second=structuredClone(specification.positions[0]);second.id=second.source_id='9';second.width_mm=900;second.height_mm=800;second.evidence=[{page:null,description:'Poz. 9: 2 szt., 900 × 800 mm FIX, profil Okna PVC Premium Line (Salamander), biały dwustronnie.'}];specification.positions.push(second);
 async function step(name,message,intent,check){
  const before=structuredClone(specification),oldPending=structuredClone(pending);
  const response=await route.POST(new Request('https://fixture.invalid/api/workspace/offer-turn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history:[],specification,pending})}));
  const body=await response.json();assert.equal(response.status,200,name);assert.equal(body.intent,intent,name);assert.equal('task' in body,false,name);
  if(intent!=='correct')assert.equal('offerSpecification' in body,false,name);
  specification=body.offerSpecification||specification;pending=body.pending;count++;
  check?.(body,before,oldPending);console.log('OFFER_CONVERSATION_CASE=verified CASE='+name+' INTENT='+intent);
 }
 const row=id=>specification.positions.find(p=>p.id===id);
 await step('ordinal_not_source_number','W drugiej pozycji zmień wyłącznie szerokość na 1230 mm.','correct',(_,before)=>{assert.equal(row('9').width_mm,1230);assert.deepEqual(row('7'),before.positions[0]);assert.equal(row('9').height_mm,800);});
 await step('repeated_edit_cm','Pozycja 9: ustaw szerokość 125 cm.','correct',()=>{assert.equal(row('9').width_mm,1250);assert.equal(specification.corrections.length,1);assert.equal(specification.corrections[0].before,900);});
 await step('current_value_discussion','Jaka jest teraz szerokość pozycji 9? Niczego nie zmieniaj.','reply',body=>assert.match(body.reply,/1250|1\s?250/));
 await step('relative_change','Pozycja 9: zmniejsz szerokość o 2 cm.','correct',()=>assert.equal(row('9').width_mm,1230));
 await step('ambiguous_position','Zmień wysokość na 1000 mm.','clarify',()=>assert.ok(pending));
 await step('discussion_preserves_question','Co oznacza DKR? Na razie tylko wyjaśnij.','reply',(_,before,old)=>{assert.deepEqual(pending,old);assert.deepEqual(specification,before);});
 await step('short_answer_resumes','Pozycja 7','correct',()=>{assert.equal(row('7').height_mm,1000);assert.equal(row('9').height_mm,800);assert.equal(pending,null);});
 await step('transport_stays_separate','Pozycja 9: ustaw osobną listwę transportową 30 mm. Wysokość produktu zachowaj.','correct',()=>{assert.equal(row('9').transport_extension_mm,30);assert.equal(row('9').height_mm,800);});
 await step('all_positions_m','Wszystkim pozycjom ustaw wysokość 1,2 m.','correct',()=>assert.deepEqual(specification.positions.map(p=>p.height_mm),[1200,1200]));
 await step('unsupported_mixed_atomic','Pozycja 9: zmień szerokość na 1400 mm i kolor zewnętrzny na antracyt.','reply',(_,before)=>assert.deepEqual(specification,before));
 await step('unitless_measure','Pozycja 9: ustaw szerokość na 1300.','clarify',()=>assert.equal(row('9').width_mm,1230));
 await step('cancel_pending','Anuluj tę poprawkę.','cancel',()=>assert.equal(pending,null));
 await step('unknown_position','Pozycja 99: szerokość 1100 mm.','clarify');
 if(specification.executed!==false||specification.sales_review_required!==true)throw Error('OFFER_EXECUTION_FLAGS_CHANGED');
 fs.mkdirSync(path.dirname(cache),{recursive:true});fs.writeFileSync(cache,JSON.stringify({passed:true,checked_at:new Date().toISOString(),model,cases:count}));
 console.log('OFFER_CONVERSATION=verified CASES='+count+' REAL_MODEL=True NO_DESKTOP_ACTIONS=True');
})().catch(error=>{console.error(String(error.message).slice(0,800));process.exitCode=1;});
