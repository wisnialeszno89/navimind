"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../lib/chatStore";
import { extractQuestion } from "../lib/extractQuestion";
import SendForm from "./SendForm";
import TypingIndicator from "./TypingIndicator";
import ReactMarkdown from "react-markdown";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
  <div className="chat-root flex flex-col flex-1 bg-transparent">
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-blue-300 opacity-80">
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
                className="ml-auto max-w-[80%] rounded-xl bg-blue-500/80 px-4 py-2 text-sm leading-relaxed"
              >
                {m.content}
              </div>
            );
          }

          const { rest, question } = extractQuestion(m.content);

          return (
            <div
              key={i}
              className="max-w-[80%] rounded-xl bg-white/10 px-4 py-3 text-sm leading-relaxed"
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

      {/* INPUT */}
      <div className="border-t border-white/10">
        <SendForm setIsTyping={setIsTyping} />
      </div>
    </div>
  );
}