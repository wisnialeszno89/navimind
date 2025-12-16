"use client";

import { useChatStore } from "@/lib/chatStore";
import SendForm from "./SendForm";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl
                    p-6 min-h-[70vh] flex flex-col shadow-xl">

      {/* POWITANIE – ADAM–NIO */}
      {messages.length === 0 && (
        <div className="mb-6 text-blue-200/80 text-lg leading-relaxed">
          <span className="mr-2">👀</span>
          Cześć. Jestem <span className="text-blue-400 font-medium">Nio</span>.
          <br />
          Co dziś Cię trapi?
        </div>
      )}

      {/* WIADOMOŚCI */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block max-w-[90%] rounded-xl px-4 py-3 text-base
                ${
                  m.role === "user"
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