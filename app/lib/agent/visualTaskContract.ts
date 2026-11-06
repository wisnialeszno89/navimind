/** Screenshot protocol isolated from semantic V1/V2. Native handles never travel. */
export const VISUAL_BODY_LIMIT = 3 * 1024 * 1024;
export const ACTION_KINDS = ['click','type_text','key','scroll','wait','inspect','done','ask_user'] as const;
export const KEYS = ['CTRL+A','BACKSPACE','HOME','END','TAB','ESC','ENTER'] as const;
export type VisualAction = {
  kind: typeof ACTION_KINDS[number]; x: number|null; y: number|null;
  width: number|null; height: number|null; text: string|null;
  key: typeof KEYS[number]|null; direction: 'up'|'down'|null;
  amount: number|null; reason: string;
};
export type VisualRequest = { version:'visual-1'; task_id:string; turn:number; goal:string;
  screen:{image_data_url:string;width:number;height:number}; feedback:Array<{action:string;status:string}> };
export type VisualResponse = { version:'visual-1';task_id:string;turn:number;action:VisualAction };
const fail=(name:string):never=>{throw new Error('visual_contract:'+name)};
function record(v:unknown,keys:string[]):Record<string,unknown>{
  if(!v||typeof v!=='object'||Array.isArray(v)) fail('object_required');
  const r=v as Record<string,unknown>;
  if(Object.keys(r).length!==keys.length||keys.some(k=>!(k in r))) fail('fields_invalid');
  return r;
}
function text(v:unknown,max:number){if(typeof v!=='string'||!v.trim()||v.length>max) fail('text_invalid')}
function integer(v:unknown,lo:number,hi:number){if(typeof v!=='number'||!Number.isInteger(v)||v<lo||v>hi)fail('integer_invalid')}
export function validateVisualRequest(value:unknown):asserts value is VisualRequest{
  const r=record(value,['version','task_id','turn','goal','screen','feedback']);
  if(r.version!=='visual-1')fail('version');text(r.task_id,128);text(r.goal,8000);integer(r.turn,0,29);
  const s=record(r.screen,['image_data_url','width','height']);integer(s.width,1,1600);integer(s.height,1,1200);
  if(typeof s.image_data_url!=='string'||!s.image_data_url.startsWith('data:image/png;base64,'))fail('png_required');
  const encoded=(s.image_data_url as string).slice(22);
  if(!encoded||encoded.length>2800000||encoded.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))fail('base64_invalid');
  const png=Buffer.from(encoded,'base64');
  if(png.toString('base64')!==encoded)fail('base64_noncanonical');
  if(png.length<24||png.length>2*1024*1024||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png.toString('ascii',12,16)!=='IHDR'||png.readUInt32BE(16)!==s.width||png.readUInt32BE(20)!==s.height)fail('png_dimensions_invalid');
  if(!Array.isArray(r.feedback)||r.feedback.length>6)fail('feedback_invalid');
  for(const raw of r.feedback as unknown[]){const f=record(raw,['action','status']);text(f.action,64);text(f.status,500)}
}
export function validateVisualAction(value:unknown,width:number,height:number):asserts value is VisualAction{
  const a=record(value,['kind','x','y','width','height','text','key','direction','amount','reason']);
  if(!ACTION_KINDS.includes(a.kind as VisualAction['kind']))fail('action_kind');text(a.reason,1000);
  const unused=new Set(['x','y','width','height','text','key','direction','amount']);
  const use=(...keys:string[])=>keys.forEach(k=>unused.delete(k));
  if(a.kind==='click'||(a.kind==='inspect'&&a.x!==null)){
    use('x','y');integer(a.x,0,width-1);integer(a.y,0,height-1);
    if(a.kind==='inspect'){use('width','height');integer(a.width,1,width-(a.x as number));integer(a.height,1,height-(a.y as number))}
  }
  if(a.kind==='type_text'){use('text');text(a.text,2000);if(/[\x00-\x1f]/.test(a.text as string))fail('text_controls')}
  if(a.kind==='key'){use('key');if(!KEYS.includes(a.key as typeof KEYS[number]))fail('key_invalid')}
  if(a.kind==='scroll'){use('direction','amount');if(!['up','down'].includes(a.direction as string))fail('scroll_direction');integer(a.amount,1,5)}
  if(a.kind==='wait'){use('amount');integer(a.amount,1,2)}
  for(const k of unused)if(a[k]!==null)fail('unused_action_fields');
}
export const VISUAL_ACTION_SCHEMA={type:'object',additionalProperties:false,
  properties:{kind:{type:'string',enum:ACTION_KINDS},x:{type:['integer','null']},y:{type:['integer','null']},
    width:{type:['integer','null']},height:{type:['integer','null']},text:{type:['string','null']},
    key:{anyOf:[{type:'string',enum:KEYS},{type:'null'}]},direction:{anyOf:[{type:'string',enum:['up','down']},{type:'null'}]},
    amount:{type:['integer','null']},reason:{type:'string'}},
  required:['kind','x','y','width','height','text','key','direction','amount','reason']};
