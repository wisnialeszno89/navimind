const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const cache={};function load(relative){if(cache[relative])return cache[relative];const file=path.resolve(__dirname,'..',relative),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const native=m.require.bind(m);m.require=name=>name.startsWith('.')?load(path.relative(path.resolve(__dirname,'..'),path.resolve(path.dirname(file),name+'.ts'))):native(name);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);return cache[relative]=m.exports;}
const sessions=load('app/lib/browser-session.ts'),{runBrowserConversation}=load('app/lib/browser-runner.ts');
const field={ref:'e'+'a'.repeat(16),tag:'input',type:'number',name:'Wysokość [mm]',role:'',href:'',disabled:false,checked:false,value_present:false};
const snapshot={revision:'a'.repeat(64),url:'about:blank',title:'NaviMind — laboratorium przeglądarki',scope:'owned_chromium_tab',text:'Niepełna konfiguracja',controls:[field]};
function harness(session=null){let current=session,turns=[],plans=[],counter=0;const calls={observe:0,execute:0,plan:[],turn:[],pending:[]};const ports={id:()=>String(++counter).padStart(20,'0'),changed:s=>{current=s;},progress:()=>{},stopped:()=>false,pending:id=>calls.pending.push(id),executed:()=>{},turn:async body=>{calls.turn.push(body);return turns.shift();},plan:async body=>{calls.plan.push(body);return plans.shift();},observe:async()=>{calls.observe++;return snapshot;},execute:async()=>{calls.execute++;return {status:'verified',message:'Sprawdzono pole.',browser:{...snapshot,text:'PODGLĄD GOTOWY',controls:[{...field,value_present:true}]}};}};return {calls,ports,get session(){return current},turn:(intent,reply='Odpowiedź')=>turns.push({intent,reply}),plan:p=>plans.push(p),run:message=>runBrowserConversation(message,[],current,ports)};}
const done={decision:'done',reply:'Podgląd gotowy.',task:null,expectedRevision:null};
const fill={decision:'act',reply:'Ustawiam wysokość.',task:{kind:'browser_fill',ref:field.ref,text:'1200'},expectedRevision:snapshot.revision};
test('a short answer resumes the original goal after an intervening discussion, without another permission question',async()=>{
 const h=harness();h.turn('start');h.plan({decision:'clarify',reply:'Jaka wysokość?',task:null});
 await h.run('Ustaw Top Trans, szerokość 1100, antracyt, DKR i pokaż podgląd.');
 assert.equal(h.session.status,'awaiting');const goal=h.session.goal;
 h.turn('reply','DKR to prawe okno rozwierno-uchylne.');const before=h.session;
 const answer=await h.run('Co oznacza DKR?');assert.equal(answer.kind,'reply');assert.equal(h.session,before);assert.equal(h.calls.execute,0);assert.equal(h.calls.observe,1);
 h.turn('continue');h.plan(fill);h.plan(done);await h.run('1200 mm');
 assert.equal(h.session.goal,goal);assert.deepEqual(h.session.updates,['1200 mm']);assert.equal(h.session.status,'completed');assert.equal(h.calls.execute,1);
 assert.equal(h.calls.plan.at(-1).session.question,'Jaka wysokość?');assert.equal(h.session.receipts.map(JSON.parse).find(r=>r.task)?.task.text,'1200');
});
test('conversation, current-page inspection and cancellation never execute a task',async()=>{
 const original=sessions.newBrowserSession('id','Wypełnij formularz.');const h=harness(original);
 h.turn('reply','Możemy porównać warianty.');await h.run('Na razie tylko przeanalizujmy opcje.');assert.equal(h.calls.observe,0);assert.equal(h.calls.execute,0);
 h.turn('inspect');h.turn('reply','Widzę pole wysokości.');await h.run('Co teraz widzisz?');assert.equal(h.calls.observe,1);assert.equal(h.calls.execute,0);assert.equal(h.session,original);
 h.turn('cancel','Odwołano zadanie.');await h.run('Anuluj zadanie.');assert.equal(h.session,null);assert.equal(h.calls.execute,0);
});
test('a new task clears prior execution evidence, while a correction preserves it',async()=>{
 let original=sessions.newBrowserSession('old','Poprzedni cel.');original=sessions.rememberBrowserReceipt(original,'{"status":"verified"}');
 const h=harness(original);h.turn('continue');h.plan(done);await h.run('Zmień tylko wysokość.');assert.ok(h.session.receipts.some(r=>JSON.parse(r).status==='verified'));
 h.turn('start');h.plan(done);await h.run('Zacznij nowe zadanie w innym formularzu.');assert.equal(h.session.goal,'Zacznij nowe zadanie w innym formularzu.');assert.equal(h.session.receipts.filter(r=>JSON.parse(r).status==='verified').length,0);assert.deepEqual(h.session.updates,[]);
});
test('unknown execution failure leaves a recoverable pending job and is not retried',async()=>{
 const h=harness();h.turn('start');h.plan(fill);h.ports.execute=async()=>{h.calls.execute++;throw Error('network failure');};
 await assert.rejects(h.run('Ustaw wysokość 1200.'),/network failure/);assert.equal(h.calls.execute,1);assert.ok(h.calls.pending.at(-1));assert.equal(h.session.receipts.filter(r=>JSON.parse(r).status==='verified').length,0);
});
test('repeated ineffective clicks pause the goal instead of looping or asking to approve each step',async()=>{
 const h=harness();h.turn('start');const click={...fill,task:{kind:'browser_click',ref:field.ref}};for(let i=0;i<3;i++)h.plan(click);
 h.ports.execute=async()=>{h.calls.execute++;return {status:'verified',message:'Kliknięto.',browser:snapshot};};
 const result=await h.run('Pokaż podgląd.');assert.equal(result.kind,'paused');assert.equal(h.calls.execute,2);assert.equal(h.session.status,'paused');
});
test('pairing again invalidates browser evidence but preserves the user goal',()=>{
 const original=sessions.rememberBrowserReceipt(sessions.newBrowserSession('id','Przygotuj podgląd.'),'{}');const fresh=sessions.invalidateBrowserEvidence(original);
 assert.equal(fresh.goal,original.goal);assert.equal(fresh.receipts.length,0);assert.equal(fresh.status,'paused');assert.equal(fresh.evidence_limited,true);
});
test('session validation bounds context explicitly and never silently truncates user instructions',()=>{
 const original=sessions.newBrowserSession('id','Cel.');assert.throws(()=>sessions.browserSession({...original,token:'secret'}));assert.throws(()=>sessions.continueBrowserSession(original,'x'.repeat(8001)));
 assert.deepEqual(original.updates,[]);let memory=original;for(let i=0;i<30;i++)memory=sessions.rememberBrowserReceipt(memory,'{"step":'+i+'}');assert.equal(memory.receipts.length,24);assert.equal(memory.evidence_limited,true);
});
