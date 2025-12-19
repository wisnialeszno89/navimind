"use client";

import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../lib/chatStore";
import { extractQuestion } from "../lib/extractQuestion";

import SendForm from "./SendForm";
import AppShell from "./AppShell";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <AppShell>
      <div className="flex flex-col h-full min-h-0">
        {/* WIADOMOŚCI */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {isEmpty && (
            <div className="text-sm text-blue-300/90">
              👀 Możemy po prostu pogadać.
              <br />
              Albo od razu przejść do konkretu.
            </div>
          )}

          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div
                  key={i}
                  className="self-end max-w-[80%] rounded-2xl bg-blue-500/80 px-4 py-2 text-sm text-white"
                >
                  {m.content}
                </div>
              );
            }

            const { rest, question } = extractQuestion(m.content);

            return (
              <div
                key={i}
                className="self-start max-w-[80%] rounded-2xl bg-white/10 px-4 py-3 text-sm text-white"
              >
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

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="border-t border-white/10 bg-black/40">
          <SendForm setIsTyping={setIsTyping} />
        </div>
      </div>
    </AppShell>
  );
}