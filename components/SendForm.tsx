"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/chatStore";
import MicButton from "@/components/MicButton";

export default function SendForm() {
  const [input, setInput] = useState("");

  const addMessage = useChatStore((s) => s.addMessage);
  const setLoading = useChatStore((s) => s.setLoading);

  const send = async () => {
    if (!input.trim()) return;

    const userMsg = {
      role: "user" as const,   // 🔥 kluczowa poprawka
      content: input,
    };

    addMessage(userMsg);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [userMsg],
        }),
      });

      const data = await res.json();

      addMessage({
        role: "assistant" as const,   // 🔥 to też musi być literal
        content: data.reply ?? "[API ERROR]",
      });
    } catch (err) {
      addMessage({
        role: "assistant" as const,
        content: "[API ERROR]",
      });
    } finally {
      setLoading(false);
    }
  };

  const onMic = (text: string) =>
    setInput((prev) => (prev ? prev + " " : "") + text);

  const uploadPdf = async (file: File | null) => {
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/pdf", { method: "POST", body: fd });
    const data = await res.json();

    if (data.text) {
      setInput((prev) => (prev ? prev + "\n" : "") + data.text);
    }
  };

  return (
    <div style={{ padding: 8 }}>
      <div className="input-row">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Napisz wiadomość..."
        />

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => uploadPdf(e.target.files?.[0] ?? null)}
        />

        <MicButton onResult={onMic} />

        <button className="button" onClick={send}>
          Wyślij
        </button>
      </div>
    </div>
  );
}