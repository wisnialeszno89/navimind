export default function TypingIndicator() {
return (
<div className="flex items-center gap-1 px-3 py-2 text-white/50">
<span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
<span className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-150" />
<span className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-300" />
</div>
);
}