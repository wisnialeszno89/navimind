"use client";

import { useState } from "react";
import { useChatStore } from "../lib/chatStore";
import MicrophoneButton from "./MicrophoneButton";

const DEMO_LIMIT = 20;

type Props = {
  setIsTyping: (v: boolean) => void;
};

export default function SendForm({ setIsTyping }: Props) {
  const [text, setText] = useState("");
  const messages = useChatStore((s) => s.messages);
  const add = useChatStore((s) => s.add);

  const used = messages.filter((m) => m.role === "user").length;
  const left = DEMO_LIMIT - used;
  const limitReached = left <= 0;

  async function send() {
    if (!text.trim() || limitReached) return;

    add({ role: "user", content: text });
    setText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: useChatStore.getState().messages,
          demo: true,
          left,
        }),
      });

      const data = await res.json();
      add({ role: "assistant", content: data.text });
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div>
      {/* LICZNIK */}
      <div
        style={{
          fontSize: 12,
          color: "#93c5fd",
          padding: "6px 12px",
          textAlign: "right",
        }}
      >
        Demo · {used}/{DEMO_LIMIT} wiadomości
      </div>

      {/* INPUT */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: 12,
          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            limitReached
              ? "Limit demo osiągnięty"
              : "Napisz wiadomość…"
          }
          disabled={limitReached}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 12,
            padding: "10px 14px",
            color: "white",
            outline: "none",
            opacity: limitReached ? 0.5 : 1,
          }}
        />

        <MicrophoneButton
          onResult={(t) =>
            setText((prev) => (prev ? prev + " " + t : t))
          }
        />

        <button
          type="submit"
          disabled={limitReached}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "0 16px",
            cursor: limitReached ? "not-allowed" : "pointer",
            opacity: limitReached ? 0.5 : 1,
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}