"use client";

import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../lib/chatStore";
import ProNotice from "./ProNotice";
import { Plus } from "lucide-react";
import { imageToBase64 } from "../lib/imageToBase64";
import BeforeAfterSlider from "./BeforeAfterSlider";

export default function SendForm({ setIsTyping, chatId }: any) {
  const [text, setText] = useState("");
  const [showPro, setShowPro] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [fileHistory, setFileHistory] = useState<
    { base64: string; type: string }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selected, setSelected] = useState<any>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const add = useChatStore((s) => s.add);
  const plan = useChatStore((s) => s.plan);

  /* ================= FILE ================= */

  function handleFile(file: File) {
    setPendingFile(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    add({
      role: "assistant",
      content: "🔥 Gotowe — wybierz opcję lub wpisz polecenie",
    });
  }

  /* ================= PRESETS ================= */

  function sendPreset(preset: string) {
    setLastPrompt(preset);

    if (fileHistory.length > 0) {
      add({ role: "user", content: preset });
      handleFileProcessFromMemory(preset);
      return;
    }

    add({
      role: "assistant",
      content: "📸 Najpierw dodaj zdjęcie",
    });
  }

  function randomPreset() {
    const presets = [
      "zmień tło na futurystyczne miasto",
      "dodaj światło studyjne",
      "zrób styl cinematic",
      "dodaj neonowe kolory",
    ];

    const random =
      presets[Math.floor(Math.random() * presets.length)];

    add({
      role: "assistant",
      content: `🎲 ${random}`,
    });

    sendPreset(random);
  }

  /* ================= SEND ================= */

  async function send() {
    const raw = text.trim();
    if (!raw) return;

    setLastPrompt(raw);
    setText("");

    if (fileHistory.length > 0 && !pendingFile) {
      add({ role: "user", content: raw });
      await handleFileProcessFromMemory(raw);
      return;
    }

    if (pendingFile && plan === "free") {
      setShowPro(true);
      return;
    }

    if (pendingFile) {
      add({ role: "user", content: raw });
      await processFile(pendingFile, raw);
      return;
    }

    add({ role: "user", content: raw });
  }

  /* ================= FILE PROCESS ================= */

  async function processFile(file: File, prompt: string) {
    add({ role: "assistant", content: "⏳ Przetwarzam..." });

    const base64 = file.type.startsWith("image/")
      ? await imageToBase64(file, 800, 0.8)
      : await fileToBase64(file);

    setFileHistory([{ base64, type: file.type }]);
    setCurrentIndex(0);

    const res = await fetch("/api/file-process", {
      method: "POST",
      body: JSON.stringify({
        file: base64,
        type: file.type,
        prompt,
      }),
    });

    const data = await res.json();

    if (data.type === "image") {
      const url = `data:image/png;base64,${data.data}`;

      setSelected({
        before: previewUrl,
        after: url,
      });

      setFileHistory((prev) => [
        ...prev,
        { base64: data.data, type: "image/png" },
      ]);

      add({
        role: "assistant",
        content: `![img](${url})`,
      });
    }

    setPendingFile(null);
  }

  async function handleFileProcessFromMemory(prompt: string) {
    const current = fileHistory[currentIndex];
    if (!current) return;

    const res = await fetch("/api/file-process", {
      method: "POST",
      body: JSON.stringify({
        file: current.base64,
        type: current.type,
        prompt,
      }),
    });

    const data = await res.json();

    if (data.type === "image") {
      const url = `data:image/png;base64,${data.data}`;

      setSelected({
        before: `data:image/png;base64,${current.base64}`,
        after: url,
      });

      setFileHistory((prev) => [
        ...prev,
        { base64: data.data, type: "image/png" },
      ]);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
  }

  /* ================= UI ================= */

  return (
    <div className="border-t p-3 space-y-3">

      {/* 🔥 HOOK */}
      <div className="text-center">
        <div className="text-lg font-semibold">
          Zmień zdjęcie w 5 sekund
        </div>
        <div className="text-xs opacity-60">
          Usuń tło lub popraw jakość jednym kliknięciem
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center gap-2 flex-wrap">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-blue-600 rounded text-sm"
        >
          📸 Dodaj zdjęcie
        </button>

        <button
          onClick={randomPreset}
          className="px-2 py-1 text-xs bg-white/10 rounded"
        >
          🎲 Eksperymentuj
        </button>
      </div>

      {/* SLIDER */}
      {selected && (
        <BeforeAfterSlider
          before={selected.before}
          after={selected.after}
        />
      )}

      {/* INPUT */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 p-3 rounded bg-black/20"
        />

        <button type="submit">➤</button>
      </form>

      {showPro && <ProNotice onClose={() => setShowPro(false)} />}
    </div>
  );
}