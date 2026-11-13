// Browser reasoning has its own model setting; lightweight general chat settings
// must not silently downgrade multi-turn task planning.
export function browserModel(){return process.env.NAVIMIND_BROWSER_MODEL||'gpt-5.4';}
