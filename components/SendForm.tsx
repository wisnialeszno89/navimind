"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/chatStore";
import MicrophoneButton from "./MicrophoneButton";
import UploadButton from "./UploadButton";

export default function SendForm() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const add = useChatStore((s) => s.add);
  const messages = useChatStore((s) => s.messages);

  async function send() {
    const text = msg.trim();
    if (!text || loading) return;

    setLoading(true);

    // 1️⃣ dodajemy usera do store
    add({ role: "user", content: text });
    setMsg("");

    try {
      // 2️⃣ wysyłamy AKTUALNY stan + nową wiadomość
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }],
        }),
      });

      if (!res.ok) {
        throw new Error("API error");
      }

      const data = await res.json();

      // 3️⃣ odpowiedź AI
      add({ role: "assistant", content: data.text });
    } catch (err) {
      add({
        role: "assistant",
        content: "⚠️ Coś poszło nie tak. Spróbuj ponownie.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        className="w-full rounded-lg bg-black/40 border border-white/10 p-2"
        placeholder="Napisz..."
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />

      <div className="flex gap-2 mt-2">
        <button
          onClick={send}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50"
        >
          {loading ? "…" : "Wyślij"}
        </button>

        <MicrophoneButton onResult={setMsg} />
        <UploadButton />
      </div>
    </div>
  );
}