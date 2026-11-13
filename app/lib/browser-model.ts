// Browser reasoning has its own model setting; lightweight general chat settings
// must not silently downgrade multi-turn task planning.
export function browserModel(){return process.env.NAVIMIND_BROWSER_MODEL||'gpt-5.4';}
export function browserPlanningOptions(){
 const model=browserModel();
 return model.startsWith('gpt-5.4')
  ? {model,reasoning_effort:'low' as const,max_completion_tokens:4096}
  : {model,temperature:0,max_completion_tokens:1600};
}
