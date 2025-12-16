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
    setMsg("");

    // 1️⃣ zapisujemy snapshot WIADOMOŚCI PRZED wysłaniem
    const snapshot = [...messages, { role: "user", content: text }];

    // 2️⃣ dodajemy usera do UI
    add({ role: "user", content: text });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: snapshot }),
      });

      if (!res.ok) {
        throw new Error("API error");
      }

      const data = await res.json();

      add({
        role: "assistant",
        content:
          typeof data.text === "string" && data.text.trim()
            ? data.text
            : "🤔 Nie dostałem odpowiedzi. Spróbuj jeszcze raz.",
      });
    } catch {
      add({
        role: "assistant",
        content: "⚠️ Coś poszło nie tak po stronie serwera.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <textarea
        value={msg}
        autoFocus
        onChange={(e) => setMsg(e.target.value)}
        className="w-full rounded-lg bg-black/40 border border-white/10 p-3 text-base
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Napisz…"
        disabled={loading}
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />

      <div className="flex gap-2 mt-3 items-center">
        <button
          onClick={send}
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 transition
                     rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "Piszę…" : "Wyślij"}
        </button>

        <MicrophoneButton onResult={setMsg} />
        <UploadButton />
      </div>
    </div>
  );
}