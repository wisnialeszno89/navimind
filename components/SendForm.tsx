"use client";

import { useState } from "react";
import { useChatStore } from "../lib/chatStore";
import UploadButton from "./UploadButton";
import MicrophoneButton from "./MicrophoneButton";

type Props = {
  setIsTyping: (value: boolean) => void;
};

export default function SendForm({ setIsTyping }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const addMessage = useChatStore((s) => s.add);

  async function sendMessage(content: string) {
    if (!content.trim()) return;

    // 1️⃣ DODAJ WIADOMOŚĆ USERA DO STORE
    addMessage({
      role: "user",
      content,
    });

    setIsTyping(true);
    setLoading(true);
    setText("");

    try {
      // 2️⃣ WYŚLIJ DO API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: useChatStore.getState().messages,
        }),
      });

      const data = await res.json();

      // 3️⃣ DODAJ ODPOWIEDŹ AI DO STORE
      if (data?.text) {
        addMessage({
          role: "assistant",
          content: data.text,
        });
      }
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

      // 🔜 później: parsowanie PDF → wiadomość do czatu
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}