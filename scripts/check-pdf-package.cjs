// Exercise the built function using only files listed in its deployment trace.
// This does not read customer files, call a model, or access the network.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=process.cwd(),entry='.next/server/app/api/workspace/document-plan/route.js';
const trace=JSON.parse(fs.readFileSync(entry+'.nft.json','utf8')).files;
const isolated=fs.mkdtempSync(path.join(os.tmpdir(),'navimind-pdf-package-'));
try{
 const files=[path.resolve(root,entry),...trace.map(f=>path.resolve(path.dirname(path.resolve(root,entry)),f))];
 for(const source of files){
  const relative=path.relative(root,source);
  if(relative.startsWith('..'))throw Error('Trace escapes project root');
  const destination=path.join(isolated,relative),stat=fs.lstatSync(source);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  if(stat.isSymbolicLink()){
   const target=fs.readlinkSync(source);
   if(path.isAbsolute(target))throw Error('Absolute dependency link in deployment trace');
   if(!fs.existsSync(destination))fs.symlinkSync(target,destination);
  }else if(stat.isFile())fs.copyFileSync(source,destination);
 }
 const code=`(async()=>{const route=require('./${entry}').routeModule.userland;const result=await route.GET();const body=await result.json();if(result.status!==200||!body.ready)throw Error(JSON.stringify(body));console.log('PDF_PACKAGED_RENDER=verified');})().catch(e=>{console.error(e);process.exitCode=1;});`;
 execFileSync(process.execPath,['-e',code],{cwd:isolated,env:{...process.env,NAVIMIND_WORKSPACE_MODE:'private',OPENAI_API_KEY:'',NODE_PATH:''},stdio:'inherit'});
}finally{fs.rmSync(isolated,{recursive:true,force:true});}
