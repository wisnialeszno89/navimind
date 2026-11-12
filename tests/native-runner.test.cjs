const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(localRequest){const filename=path.resolve(__dirname,'../app/lib/native-runner.ts'),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m.require=name=>{if(name==='./desktop-connection')return {localRequest};throw Error('Unexpected import '+name);};m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);return m.exports;}
const snap={revision:'a'.repeat(64),image:'synthetic',width:10,height:10,title:'Paint',scope:'owned_paint_window'};
function hooks(){const h={ids:[],n:0,stop:false};return {...h,progress:()=>{},stopped:()=>h.stop,pending:id=>h.ids.push(id),executed:()=>h.n++,state:h};}
test('native runner observes after each step, then saves and retains independent result',async()=>{
 const old=global.fetch,calls=[];let planned=0;
 global.fetch=async(_url,options)=>{assert.ok(!options.body.includes('c'.repeat(32)));return new Response(JSON.stringify(planned++===0?{decision:'act',reply:'Klikam',task:{kind:'native_click',x:2,y:2},expectedRevision:snap.revision}:{decision:'done',reply:'Wynik widoczny',task:null,expectedRevision:snap.revision}));};
 const lib=load(async(_token,url,body)=>{calls.push([url,body]);if(url==='/native/start')return {...snap,session:'c'.repeat(32)};if(body.task.kind==='native_finish')return {status:'verified',message:'Zapis sprawdzony',native_result:{saved_pixels_changed:true,goal_verified:false}};return {status:'verified',message:'Odczyt po kroku',native:snap};});
 try{const h=hooks(),r=await lib.runNativeCommand('local-token','Narysuj',[],h);assert.equal(r.result.native_result.goal_verified,false);assert.equal(h.state.n,2);assert.deepEqual(calls.map(c=>c[0]),['/native/start','/execute','/execute']);assert.equal(calls[2][1].task.kind,'native_finish');assert.equal(h.state.ids.at(-1),null);}finally{global.fetch=old;}
});
test('stop received while planning prevents execution',async()=>{
 const old=global.fetch,h=hooks(),calls=[];
 global.fetch=async()=>{h.state.stop=true;return new Response(JSON.stringify({decision:'act',reply:'Krok',task:{kind:'native_click',x:2,y:2}}));};
 const lib=load(async(_t,url)=>{calls.push(url);return {...snap,session:'c'.repeat(32)};});
 try{const r=await lib.runNativeCommand('local-token','Narysuj',[],h);assert.match(r.reply,/Zatrzymałem/);assert.deepEqual(calls,['/native/start']);}finally{global.fetch=old;}
});
test('uncertain execution keeps the job id for result recovery and never retries',async()=>{
 const old=global.fetch,h=hooks();let dispatched=0;
 global.fetch=async()=>new Response(JSON.stringify({decision:'act',reply:'Krok',task:{kind:'native_click',x:2,y:2},expectedRevision:snap.revision}));
 const lib=load(async(_t,url)=>{if(url==='/native/start')return {...snap,session:'c'.repeat(32)};dispatched++;throw Error('transport lost');});
 try{await assert.rejects(lib.runNativeCommand('local-token','Narysuj',[],h));assert.equal(dispatched,1);assert.ok(h.state.ids.at(-1));}finally{global.fetch=old;}
});
