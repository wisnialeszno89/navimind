import type {BrowserSnapshot,BrowserTask} from './browser-plan';

export const MAX_BROWSER_STEP_LENGTH=6000;
// Refs expire at the next observation. Preserve the observed target description
// BEFORE execution so later model turns can associate verified input with a field.
// This sends the requested task value already known to the model, never a field's
// actual contents, pairing credentials, cookies or storage.
export function browserStepReceipt(before:BrowserSnapshot,task:BrowserTask,result:{status:string;message:string;browser?:BrowserSnapshot;verified_input_revision?:string}){
 const c='ref' in task?before.controls.find(c=>c.ref===task.ref):undefined;
 const target=c?{name:c.name,tag:c.tag,type:c.type}:null;
 const receipt={task,target,result:result.message.slice(0,300),status:result.status,observed_url:result.browser?.url,verified_input_revision:result.status==='verified'&&result.verified_input_revision===result.browser?.revision?result.verified_input_revision:undefined};
 const serialized=JSON.stringify(receipt);
 if(serialized.length<=MAX_BROWSER_STEP_LENGTH)return serialized;
 // Keep valid JSON. The old string slice could cut a record mid-property.
 const compactTask='text' in task?{kind:task.kind,ref:task.ref,value_omitted:true,text_length:task.text.length}:task;
 return JSON.stringify({...receipt,task:compactTask,result:'Wynik opisowy pominięto z powodu długości.'});
}
