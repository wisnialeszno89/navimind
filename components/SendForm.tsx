"use client";

import { useState } from "react";
import { useChatStore } from "../lib/chatStore";
import MicrophoneButton from "./MicrophoneButton";

type Props = {
  setIsTyping: (v: boolean) => void;
};

export default function SendForm({ setIsTyping }: Props) {
  const [text, setText] = useState("");
  const add = useChatStore((s) => s.add);

  async function send() {
    if (!text.trim()) return;

    // wiadomość usera zawsze dodajemy
    add({ role: "user", content: text });
    setText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: useChatStore.getState().messages,
        }),
      });

      // 🔒 LIMIT DEMO – JEDYNE ŹRÓDŁO PRAWDY
      if (res.status === 429) {
        add({
          role: "assistant",
          content:
            "Limit demo został osiągnięty 🔒\n\n" +
            "Masz 20 wiadomości na 24 godziny.\n" +
            "W wersji PRO nie ma limitów i rozmowa nie jest przerywana.",
        });
        return;
      }

      const data = await res.json();

      if (data?.text) {
        add({ role: "assistant", content: data.text });
      }
    } finally {
      setIsTyping(false);
    }
  }

  async function uploadPDF(file: File) {
    const form = new FormData();
    form.append("file", file);

    setIsTyping(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data?.text) {
        add({ role: "assistant", content: data.text });
      }
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div>
      {/* INFO DEMO – UCZCIWE, BEZ LICZNIKA */}
      <div className="text-xs text-blue-300 text-right px-3 pb-1">
        Demo · do 20 wiadomości / 24h
      </div>

      {/* INPUT BAR */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-white/10 p-3 items-center"
      >
        {/* PDF */}
        <label
          className="cursor-pointer px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition"
          title="Analizuj PDF"
        >
          📄
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPDF(file);
              e.target.value = "";
            }}
          />
        </label>

        {/* MICROPHONE */}
        <MicrophoneButton
          onResult={(t) =>
            setText((prev) => (prev ? prev + " " + t : t))
          }
        />

        {/* TEXT INPUT */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napisz wiadomość…"
          className="flex-1 bg-white/10 rounded px-4 py-2 text-white outline-none"
        />

        {/* SEND */}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 rounded text-white"
        >
          ➤
        </button>
      </form>
    </div>
  );
}