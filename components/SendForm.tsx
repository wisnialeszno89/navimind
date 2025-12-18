"use client";

import { useState } from "react";
import UploadButton from "./UploadButton";
import MicrophoneButton from "./MicrophoneButton";

type Props = {
  setIsTyping: (value: boolean) => void;
};

export default function SendForm({ setIsTyping }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(content: string) {
    if (!content.trim()) return;

    setIsTyping(true);
    setLoading(true);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 👉 Twoja istniejąca logika messages / thread
          content,
        }),
      });

      setText("");
    } catch (err) {
      console.error("SEND ERROR:", err);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  }

  async function handleUpload(file: File) {
    const form = new FormData();
    form.append("file", file);

    try {
      setLoading(true);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      console.log("UPLOADED:", data);

      // 🔜 później: parsowanie PDF → wiadomość do czatu
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-white/10">
      {/* ===== FORM ===== */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(text);
        }}
        className="flex items-center gap-2 px-3 py-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napisz wiadomość…"
          className="flex-1 bg-transparent outline-none text-sm"
          disabled={loading}
        />

        <UploadButton onUpload={handleUpload} />

        <MicrophoneButton
          onResult={(t) => {
            setText((prev) => (prev ? prev + " " + t : t));
          }}
        />

        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 rounded bg-blue-500/80 hover:bg-blue-500 disabled:opacity-50"
        >
          ➤
        </button>
      </form>

      {/* ===== STOPKA PRAWNA ===== */}
      <div className="px-3 pb-2 text-[11px] leading-snug text-white/50 flex flex-wrap gap-x-2 gap-y-1">
        <span>
          NaviMind to narzędzie refleksji, nie terapia.
        </span>
        <span>•</span>
        <a
          href="/informacje"
          className="hover:text-white/80 underline underline-offset-2"
        >
          Regulamin i prywatność
        </a>
      </div>
    </div>
  );
}