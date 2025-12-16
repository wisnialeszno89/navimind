"use client";

import { useChatStore } from "@/lib/chatStore";
import SendForm from "./SendForm";
import AppShell from "./AppShell";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);

  return (
    <AppShell>
      <div className="chat-box">
        <div style={{ marginBottom: 16, color: "#93c5fd" }}>
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
    </AppShell>
  );
}