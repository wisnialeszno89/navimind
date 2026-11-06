import {timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {VISUAL_BODY_LIMIT,validateVisualRequest} from '@/lib/agent/visualTaskContract';
import {reasonVisualTask} from '@/lib/agent/reasonVisualTask';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const error=(code:string,status:number)=>NextResponse.json({error:code},{status});
export async function POST(req:Request){
  // New endpoint stays off until explicitly configured after deployment review.
  if(process.env.NAVIMIND_VISUAL_ENABLED!=='1')return error('VISUAL_NOT_ENABLED',503);
  const secret=process.env.NAVIMIND_AGENT_SECRET?.trim();
  if(!secret)return error('AGENT_AUTH_NOT_CONFIGURED',503);
  const supplied=Buffer.from(req.headers.get('x-navimind-agent-secret')||'');const configured=Buffer.from(secret);
  if(supplied.length!==configured.length||!timingSafeEqual(supplied,configured))return error('UNAUTHORIZED',401);
  if((req.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')return error('UNSUPPORTED_CONTENT_TYPE',415);
  if(!process.env.OPENAI_API_KEY?.trim())return error('AGENT_PROVIDER_NOT_CONFIGURED',503);
  try{
    const reader=req.body?.getReader();if(!reader)return error('INVALID_VISUAL_TASK',400);
    let size=0;const chunks:Uint8Array[]=[];
    try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>VISUAL_BODY_LIMIT){await reader.cancel();return error('PAYLOAD_TOO_LARGE',413)}chunks.push(value)}}finally{reader.releaseLock()}
    let body:unknown;
    try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));validateVisualRequest(body)}catch{return error('INVALID_VISUAL_TASK',400)}
    return NextResponse.json(await reasonVisualTask(body));
  }catch{
    // No screenshot, request, secret, endpoint or provider body in logs/errors.
    return error('VISUAL_TASK_FAILED',502);
  }
}
