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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  // 🔽 Auto-scroll TYLKO jeśli user jest na dole
  useEffect(() => {
    if (stickToBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, stickToBottom]);

  // 👆 Wykrywanie ręcznego scrolla użytkownika
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 40; // px
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setStickToBottom(atBottom);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ===== WIADOMOŚCI (SCROLL) ===== */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3
                   scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="text-blue-300 text-sm opacity-80">
            👀 Możemy po prostu pogadać.
            <br />
            Albo od razu przejść do konkretu.
          </div>
        )}

        {messages.map((m, i) => {
          // ===== USER =====
          if (m.role === "user") {
            return (
              <div
                key={i}
                className="self-end max-w-[80%] bg-blue-600 text-white
                           rounded-xl px-4 py-2 text-sm shadow-md"
              >
                {m.content}
              </div>
            );
          }

          // ===== ASSISTANT =====
          const { rest, question } = extractQuestion(m.content);

          return (
            <div
              key={i}
              className="max-w-[80%] bg-white/10 text-white
                         rounded-xl px-4 py-3 text-sm leading-relaxed"
            >
              {rest && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{rest}</ReactMarkdown>
                </div>
              )}

              {question && (
                <div className="mt-3 text-blue-300 font-medium">
                  {question}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && <TypingIndicator />}

        {/* kotwica do auto-scroll */}
        <div ref={endRef} />
      </div>

      {/* ===== INPUT ===== */}
      <div className="shrink-0 border-t border-white/10">
        <SendForm setIsTyping={setIsTyping} />
      </div>
    </div>
  );
}