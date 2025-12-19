"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../lib/chatStore";
import { extractQuestion } from "../lib/extractQuestion";
import SendForm from "./SendForm";
import TypingIndicator from "./TypingIndicator";
import ReactMarkdown from "react-markdown";

const MAX_MESSAGES = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const [isTyping, setIsTyping] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // LIMIT LOGIC
  useEffect(() => {
    const count = Number(
      localStorage.getItem("navimind_message_count") || 0
    );
    const ts = Number(
      localStorage.getItem("navimind_first_message_ts") || 0
    );

    if (!ts && count > 0) {
      localStorage.setItem(
        "navimind_first_message_ts",
        Date.now().toString()
      );
    }

    if (ts && Date.now() - ts > DAY_MS) {
      localStorage.removeItem("navimind_message_count");
      localStorage.removeItem("navimind_first_message_ts");
      setBlocked(false);
      return;
    }

    if (count >= MAX_MESSAGES) {
      setBlocked(true);
    }
  }, [messages]);

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

        {blocked && (
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              color: "#e5e7eb",
              fontSize: 14,
            }}
          >
            <strong>Limit wersji demo osiągnięty.</strong>
            <br />
            20 wiadomości / 24h.
            <br />
            Wersja Pro: bez limitów.
          </div>
        )}

        {isTyping && <TypingIndicator />}

        <div ref={endRef} />
      </div>

      {/* INPUT */}
      {!blocked && <SendForm setIsTyping={setIsTyping} />}
    </div>
  );
}