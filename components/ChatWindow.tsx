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
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* MESSAGES */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#93c5fd", fontSize: 14 }}>
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
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "80%",
                  background: "#3b82f6",
                  color: "white",
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontSize: 14,
                }}
              >
                {m.content}
              </div>
            );
          }

          const { rest, question } = extractQuestion(m.content);

          return (
            <div
              key={i}
              style={{
                maxWidth: "80%",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 14,
              }}
            >
              {rest && (
                <div style={{ lineHeight: 1.5 }}>
                  <ReactMarkdown>{rest}</ReactMarkdown>
                </div>
              )}

              {question && (
                <div
                  style={{
                    marginTop: 12,
                    color: "#93c5fd",
                    fontWeight: 500,
                  }}
                >
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
      <SendForm setIsTyping={setIsTyping} />
    </div>
  );
}
