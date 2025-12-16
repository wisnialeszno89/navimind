"use client";

import { useChatStore } from "@/lib/chatStore";
import SendForm from "./SendForm";
import AppShell from "./AppShell";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);

  const isEmpty = messages.length === 0;

  return (
    <AppShell>
      <div className="chat-box">
        {isEmpty && (
          <div
            style={{
              marginBottom: 16,
              color: "#93c5fd",
              opacity: 0.85,
              fontSize: 14,
            }}
          >
            👀 Możemy po prostu pogadać.  
            <br />
            Albo od razu przejść do konkretu.
          </div>
        )}

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`msg ${m.role === "user" ? "user" : "ai"}`}
            >
              {m.content}
            </div>
          ))}
        </div>

        <SendForm />
      </div>
    </AppShell>
  );
}