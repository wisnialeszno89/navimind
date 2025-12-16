"use client";

import { useChatStore } from "@/lib/chatStore";
import SendForm from "./SendForm";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);

  return (
    <div className="center-screen stars">
      <div className="chat-box">
        <div style={{ marginBottom: 12, color: "var(--blue-soft)" }}>
          👀 Cześć, w czym mogę Ci dzisiaj pomóc?
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "user" : "ai"}`}>
              {m.content}
            </div>
          ))}
        </div>

        <SendForm />
      </div>
    </div>
  );
}