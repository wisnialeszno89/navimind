"use client";

import { useChatStore } from "@/lib/chatStore";
import SendForm from "./SendForm";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);

  return (
    <div className="w-full max-w-[720px] h-[80vh] bg-black/40 backdrop-blur
                    border border-white/10 rounded-2xl shadow-xl
                    flex flex-col p-6">

      {/* POWITANIE */}
      <div className="mb-4 text-lg text-blue-200 flex items-center gap-2">
        👀 <span>Cześć, w czym mogę Ci dzisiaj pomóc?</span>
      </div>

      {/* WIADOMOŚCI */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-xl text-base leading-relaxed
                ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-white"
                }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <SendForm />
    </div>
  );
}