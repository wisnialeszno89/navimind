export default function TypingIndicator() {
  return (
    <div className="px-4 py-2 flex items-center gap-1 opacity-70">
      <span className="nm-typing-dot">●</span>
      <span className="nm-typing-dot" style={{ animationDelay: "0.2s" }}>●</span>
      <span className="nm-typing-dot" style={{ animationDelay: "0.4s" }}>●</span>
    </div>
  );
}