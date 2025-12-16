"use client";
import { useChatStore } from "@/lib/chatStore";
import SendForm from "./SendForm";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl
                    p-6 min-h-[70vh] flex flex-col shadow-xl">

      {/* POWITANIE */}
      <div className="mb-6 text-blue-200/90 text-lg">
        Cześć, w czym mogę Ci dzisiaj pomóc? <span className="ml-1">👀</span>
      </div>

      {/* WIADOMOŚCI */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-5 py-4
                ${m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-blue-100"
                }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <SendForm />
    </div>
  );
}