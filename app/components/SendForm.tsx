"use client";

import { useState, useRef } from "react";
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

  const [mode, setMode] = useState<"idle" | "preview" | "edit">("idle");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const add = useChatStore((s) => s.add);
  const plan = useChatStore((s) => s.plan);

  /* ================= SHARE ================= */

  async function shareImage(base64: string) {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();
      const url = `${window.location.origin}/share/${data.id}`;

      await navigator.clipboard.writeText(url);
      window.open(url, "_blank");

      add({
        role: "assistant",
        content: `🔗 Link skopiowany:\n${url}`,
      });
    } catch {
      add({
        role: "assistant",
        content: "❌ Nie udało się udostępnić",
      });
    }
  }

  /* ================= FILE ================= */

  function handleFile(file: File) {
    setPendingFile(file);
    setMode("preview");

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // miniaturka w czacie
      add({
        role: "user",
        content: `![img](${url})`,
      });
    }

    add({
      role: "assistant",
      content: "📸 Zdjęcie gotowe. Co chcesz z nim zrobić?",
    });
  }

  /* ================= PRESETS ================= */

  function sendPreset(preset: string) {
    setText(preset);
    setTimeout(() => send(), 50);
  }

  function randomPreset() {
    const presets = [
      "usuń tło",
      "zmień tło na biuro",
      "popraw jakość",
      "dodaj światło studyjne",
      "styl cinematic",
    ];

    const random =
      presets[Math.floor(Math.random() * presets.length)];

    add({
      role: "assistant",
      content: `🎲 ${random}`,
    });

    sendPreset(random);
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: base64,
        type: file.type,
        prompt,
      }),
    });

    const data = await res.json();

    if (data.type === "image") {
      const url = `data:image/png;base64,${data.data}`;

      setPreviewUrl(null); // 🔥 usuwa overlay bug

      setSelected({
      before: previewUrl || undefined,
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

      add({
        role: "assistant",
        content: "⬇️ Możesz pobrać lub udostępnić obraz poniżej",
      });
    }

    setPendingFile(null);
  }

  async function handleFileProcessFromMemory(prompt: string) {
    const current = fileHistory[currentIndex];
    if (!current) return;

    add({ role: "assistant", content: "⏳ Edytuję..." });

    const res = await fetch("/api/file-process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

      add({
        role: "assistant",
        content: `![img](${url})`,
      });

      add({
        role: "assistant",
        content: "⬇️ Możesz pobrać lub udostępnić obraz poniżej",
      });
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
  }

  /* ================= SEND ================= */

  async function send() {
    const raw = text.trim();
    if (!raw) return;

    setLastPrompt(raw);
    setText("");

    if (mode === "preview" && pendingFile) {
      add({ role: "user", content: raw });
      await processFile(pendingFile, raw);
      setMode("edit");
      return;
    }

    if (mode === "edit") {
      add({ role: "user", content: raw });
      await handleFileProcessFromMemory(raw);
      return;
    }

    // chat
    setIsTyping(true);

    add({ role: "user", content: raw });
    add({ role: "assistant", content: "..." });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          message: raw,
        }),
      });

      const data = await res.json();

      const reply =
        data.reply || "⚠️ Brak odpowiedzi";

      const state = useChatStore.getState();
      const messages = [...state.messages];

      messages[messages.length - 1] = {
        role: "assistant",
        content: reply,
      };

      state.setMessages(messages);
    } catch {
      const state = useChatStore.getState();
      const messages = [...state.messages];

      messages[messages.length - 1] = {
        role: "assistant",
        content: "❌ Błąd czatu",
      };

      state.setMessages(messages);
    } finally {
      setIsTyping(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="border-t p-3 space-y-3">

      <div className="text-center">
        <div className="text-lg font-semibold">
          Zmień zdjęcie w 5 sekund
        </div>
        <div className="text-xs opacity-60">
          Usuń tło lub popraw jakość
        </div>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
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

      {selected && (
        <BeforeAfterSlider
          before={selected.before}
          after={selected.after}
        />
      )}

      {selected?.after && (
        <div className="flex gap-2 justify-center mt-2">
          <a
            href={selected.after}
            download="navimind-image.png"
            className="px-3 py-1 text-xs bg-white/10 rounded"
          >
            ⬇️ Pobierz
          </a>

          <button
            onClick={() => shareImage(selected.after)}
            className="px-3 py-1 text-xs bg-white/10 rounded"
          >
            🔗 Udostępnij
          </button>
        </div>
      )}

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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="flex-1 p-3 rounded bg-black/20"
        />

        <button type="submit">➤</button>
      </form>

      {showPro && <ProNotice onClose={() => setShowPro(false)} />}
    </div>
  );
}