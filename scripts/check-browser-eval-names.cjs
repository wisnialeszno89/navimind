// Catch script typos before a build spends API calls on real-model evaluations.
const ts=require('typescript'),path=require('node:path');
const files=process.argv.slice(2);
const roots=(files.length?files:['scripts/check-browser-model.cjs','scripts/check-browser-conversation.cjs','scripts/browser-eval-environment.cjs']).map(f=>path.resolve(f));
const included=new Set(roots);
const program=ts.createProgram(roots,{allowJs:true,checkJs:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS});
const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.file&&included.has(path.resolve(d.file.fileName))&&(d.code<2000||[2304,2552].includes(d.code)));
for(const d of errors){const loc=d.file.getLineAndCharacterOfPosition(d.start||0);console.error(path.relative(process.cwd(),d.file.fileName)+':'+(loc.line+1)+' '+ts.flattenDiagnosticMessageText(d.messageText,' '));}
if(errors.length)process.exitCode=1;else console.log('BROWSER_EVAL_NAMES=verified');
