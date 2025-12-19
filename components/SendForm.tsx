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
        body: JSON.stringify({ content }),
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
      await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-white/10 mt-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(text);
        }}
        className="flex items-center gap-2 px-3 py-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napisz wiadomość…"
          className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400/40"
          disabled={loading}
        />

        <UploadButton onUpload={handleUpload} />

        <MicrophoneButton
          onResult={(t) =>
            setText((prev) => (prev ? prev + " " + t : t))
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 rounded-xl bg-blue-500/80 hover:bg-blue-500 disabled:opacity-50"
        >
          ➤
        </button>
      </form>

      <div className="px-4 pb-2 text-[11px] text-white/50 flex gap-1">
        <span>NaviMind to narzędzie refleksji, nie terapia.</span>
        <a href="/informacje" className="underline hover:text-white/80">
          Regulamin i prywatność
        </a>
      </div>
    </div>
  );
}