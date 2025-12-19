"use client";

import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../lib/chatStore";
import { extractQuestion } from "../../lib/extractQuestion";

import SendForm from "./SendForm";
import AppShell from "./AppShell";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isEmpty = messages.length === 0;

  // 🔽 auto-scroll na dół
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <AppShell>
      <div className="flex flex-col flex-1 min-h-0">
        {/* 🧠 MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {isEmpty && (
            <div className="text-sm text-blue-300 opacity-80">
              👀 Możemy po prostu pogadać.
              <br />
              Albo od razu przejść do konkretu.
            </div>
          )}

          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="msg user">
                  {m.content}
                </div>
              );
            }

            const { rest, question } = extractQuestion(m.content);

            return (
              <div key={i} className="msg ai">
                {rest && <div>{rest}</div>}

                {question && (
                  <div className="mt-4 text-blue-300 font-medium">
                    {question}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && <TypingIndicator />}

          {/* anchor scrolla */}
          <div ref={messagesEndRef} />
        </div>

        {/* ✍️ INPUT */}
        <div className="sticky bottom-0 bg-black border-t border-white/10">
          <SendForm setIsTyping={setIsTyping} />
        </div>
      </div>
    </AppShell>
  );
}