"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { useChatStore } from "../lib/chatStore";
import { extractQuestion } from "../lib/extractQuestion";

import SendForm from "./SendForm";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const messageCount = useChatStore((s) => s.messageCount);

  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex h-full flex-col bg-transparent">
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-blue-300/80">
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
                className="ml-auto max-w-[75%] rounded-2xl bg-blue-500/80 px-4 py-2 text-sm leading-relaxed shadow"
              >
                {m.content}
              </div>
            );
          }

          const { rest, question } = extractQuestion(m.content);

          return (
            <div
              key={i}
              className="max-w-[75%] rounded-2xl bg-white/10 px-4 py-3 text-sm leading-relaxed shadow"
            >
              {rest && (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{rest}</ReactMarkdown>
                </div>
              )}

              {question && (
                <div className="mt-4 text-blue-300 font-medium">
                  {question}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* LICZNIK */}
      <div className="px-6 py-1 text-xs text-white/40">
        {messageCount}/15 wiadomości
      </div>

      {/* INPUT */}
      <div className="border-t border-white/10">
        <SendForm setIsTyping={setIsTyping} />
      </div>
    </div>
  );
}