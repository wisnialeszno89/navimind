"use client";

import { useChatStore } from "@/lib/chatStore";
import SendForm from "./SendForm";
import { useEffect, useRef } from "react";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#020617]/80 p-4 min-h-[70vh] flex flex-col">
      {/* POWITANIE */}
      {messages.length === 0 && (
        <div className="text-blue-200/70 mb-4 flex items-center gap-2">
          <span>👀</span>
          <span>Cześć. Co dziś Cię trapi?</span>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-blue-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <SendForm />
    </div>
  );
}