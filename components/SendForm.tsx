"use client";


import { useState } from "react";


export default function SendForm({ setIsTyping }: { setIsTyping: (v: boolean) => void }) {
const [text, setText] = useState("");


async function submit(e: React.FormEvent) {
e.preventDefault();
if (!text.trim()) return;


setIsTyping(true);
try {
// Twoja istniejąca logika wysyłania wiadomości
setText("");
} finally {
setIsTyping(false);
}
}


return (
<form onSubmit={submit} className="flex items-center gap-2 px-4 py-3">
<input
value={text}
onChange={(e) => setText(e.target.value)}
placeholder="Napisz wiadomość…"
className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/15 transition"
/>
<button
type="submit"
className="px-4 py-3 rounded-xl bg-blue-500/90 hover:bg-blue-500 transition text-white"
>
➤
</button>
</form>
);
}