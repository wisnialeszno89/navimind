"use client";

import { useState } from "react";
import { useChatStore } from "../lib/chatStore";

type Props = {
  setIsTyping: (v: boolean) => void;
};

export default function SendForm({ setIsTyping }: Props) {
  const [text, setText] = useState("");
  const add = useChatStore((s) => s.add);

  async function send() {
    if (!text.trim()) return;

    add({ role: "user", content: text });
    setText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: useChatStore.getState().messages }),
      });

      const data = await res.json();
      add({ role: "assistant", content: data.text });
    } finally {
      setIsTyping(false);
    }
  }

  return (
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
        placeholder="Napisz wiadomość…"
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: 12,
          padding: "10px 14px",
          color: "white",
          outline: "none",
        }}
      />

      <button
        type="submit"
        style={{
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "0 16px",
          cursor: "pointer",
        }}
      >
        ➤
      </button>
    </form>
  );
}
