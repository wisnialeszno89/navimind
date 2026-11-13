const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const file=path.resolve(__dirname,'../app/lib/browser-step-receipt.ts'),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {browserStepReceipt,MAX_BROWSER_STEP_LENGTH}=m.exports;
const old='e'+'1'.repeat(16),fresh='e'+'2'.repeat(16);
const before={url:'about:blank',controls:[{ref:old,tag:'input',type:'number',name:'Szerokość [mm]',value:'PRIVATE_ACTUAL_CONTENT'}]};
test('a verified input stays associated with its observed field after refs rotate',()=>{
 const result={status:'verified',message:'Wpisano tekst i sprawdzono zawartość pola.',browser:{url:'about:blank',controls:[{...before.controls[0],ref:fresh}]}};
 const receipt=JSON.parse(browserStepReceipt(before,{kind:'browser_fill',ref:old,text:'1100'},result));
 assert.deepEqual(receipt.target,{name:'Szerokość [mm]',tag:'input',type:'number'});
 assert.equal(receipt.status,'verified');assert.equal(receipt.task.text,'1100');
 assert.ok(!JSON.stringify(receipt).includes('PRIVATE_ACTUAL_CONTENT'));assert.ok(!JSON.stringify(receipt).includes(fresh));
});
test('rejected input is never promoted to verified in the receipt',()=>{
 const receipt=JSON.parse(browserStepReceipt(before,{kind:'browser_fill',ref:old,text:'1100'},{status:'review',message:'Strona zmieniła się.'}));
 assert.equal(receipt.status,'review');assert.equal(receipt.target.name,'Szerokość [mm]');
});
test('long step records remain bounded valid JSON instead of being cut mid-property',()=>{
 const receipt=browserStepReceipt(before,{kind:'browser_fill',ref:old,text:'"'.repeat(2000)},{status:'verified',message:'x'.repeat(1000),browser:{url:'https://example.org/'+'a'.repeat(2000)}});
 assert.ok(receipt.length<=MAX_BROWSER_STEP_LENGTH);
 const parsed=JSON.parse(receipt);assert.equal(parsed.target.name,'Szerokość [mm]');assert.equal(parsed.task.value_omitted,true);assert.equal(parsed.task.text_length,2000);
});
