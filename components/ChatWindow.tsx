"use client";

import { useChatStore } from "@/lib/chatStore";
import MessageBubble from "./MessageBubble";
import SendForm from "./SendForm";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);

  return (
    <div
      style={{
        background: "rgba(20,20,30,0.65)",
        borderRadius: 12,
        padding: 16,
        minHeight: "65vh",
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: 15,
        }}
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
      </div>

      <SendForm />
    </div>
  );
}