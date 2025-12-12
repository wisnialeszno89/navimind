"use client";
import { useChatStore } from "@/lib/chatStore";
import { MODES } from "@/lib/modes";


export default function ModeSelector(){
const setMode = useChatStore(s=>s.setMode);
const mode = useChatStore(s=>s.mode);


const pick = (key:string)=>{
setMode(MODES[key as keyof typeof MODES] || MODES.default);
};


return (
<div className="mode-row">
<button className="button" onClick={()=>pick('nio_blyskotliwy')}>Błyskotliwy</button>
<button className="button" onClick={()=>pick('wojownik_miekkie_serce')}>Wojownik</button>
<button className="button" onClick={()=>pick('strategiczny')}>Strategiczny</button>
</div>
);
}