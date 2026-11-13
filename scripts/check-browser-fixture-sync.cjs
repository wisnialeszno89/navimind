// Pin the Windows executor evidence to the same immutable fixture revision.
const fs=require('node:fs'),crypto=require('node:crypto');
(async()=>{
 const pin=JSON.parse(fs.readFileSync('contracts/browser-regression-executor.json'));
 if(pin.repository!=='wisnialeszno89/wh-ai-parser'||pin.path!=='contracts/browser-regression-v1.json'||!/^[a-f0-9]{40}$/.test(pin.commit)||!/^[a-f0-9]{64}$/.test(pin.sha256))throw Error('INVALID_EXECUTOR_FIXTURE_PIN');
 const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 if(digest(fs.readFileSync(pin.path))!==pin.sha256)throw Error('LOCAL_BROWSER_FIXTURE_DRIFT');
 if(process.argv.includes('--remote')){
  const response=await fetch(`https://raw.githubusercontent.com/${pin.repository}/${pin.commit}/${pin.path}`,{signal:AbortSignal.timeout(20000)});
  if(!response.ok||digest(Buffer.from(await response.arrayBuffer()))!==pin.sha256)throw Error('EXECUTOR_BROWSER_FIXTURE_MISMATCH');
  console.log('BROWSER_FIXTURE_SYNC=verified EXECUTOR_COMMIT='+pin.commit+' FIXTURE_SHA256='+pin.sha256);
 }else console.log('BROWSER_FIXTURE_PIN=verified_local REMOTE=False FIXTURE_SHA256='+pin.sha256);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
