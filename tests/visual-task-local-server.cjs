// Local-only integration fixture. Never calls OpenAI or reads real secrets.
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
function load(relative,stubs={}){const file=path.resolve(__dirname,'..',relative);const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));const original=m.require.bind(m);m.require=id=>Object.hasOwn(stubs,id)?stubs[id]:original(id);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);return m.exports}
const contract=load('app/lib/agent/visualTaskContract.ts');
class FakeOpenAI{constructor(){this.chat={completions:{create:async args=>{
  const image=args.messages[1].content.find(part=>part.type==='image_url');
  if(!image?.image_url?.url?.startsWith('data:image/png;base64,'))throw new Error('Image was not delivered to provider');
  return {choices:[{message:{content:JSON.stringify({kind:'inspect',x:null,y:null,width:null,height:null,text:null,key:null,direction:null,amount:null,reason:'Synthetic image transport fixture, not real model inference.'})}}]};
}}}}}
const reasoning=load('app/lib/agent/reasonVisualTask.ts',{'openai':FakeOpenAI,'./visualTaskContract':contract});
const route=load('app/api/agent/visual-task/route.ts',{'next/server':{NextResponse:{json:(body,init)=>new Response(JSON.stringify(body),{status:init?.status||200})}},'@/lib/agent/visualTaskContract':contract,'@/lib/agent/reasonVisualTask':reasoning});
process.env.NAVIMIND_VISUAL_ENABLED='1';process.env.NAVIMIND_AGENT_SECRET='synthetic-loopback-secret';process.env.OPENAI_API_KEY='synthetic-no-network-key';
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const response=await route.POST(new Request('http://localhost/api/agent/visual-task',{method:'POST',headers:req.headers,body:Buffer.concat(chunks)}));res.writeHead(response.status,{'content-type':'application/json'});res.end(await response.text())}catch{res.writeHead(500);res.end('{}')}});
server.listen(0,'127.0.0.1',()=>console.log('VISUAL_TEST_PORT='+server.address().port));
