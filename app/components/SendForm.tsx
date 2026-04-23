"use client";

import { useState, useRef } from "react";
import { useChatStore } from "../lib/chatStore";
import ProNotice from "./ProNotice";
import { Plus } from "lucide-react";
import { imageToBase64 } from "../lib/imageToBase64";

export default function SendForm({ setIsTyping, chatId }: any) {
  const [text, setText] = useState("");
  const [showPro, setShowPro] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const [isSending, setIsSending] = useState(false);
  const add = useChatStore((s) => s.add);
  const plan = useChatStore((s) => s.plan);
  function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

  /* ================= VOICE ================= */

  function startVoice() {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      alert("Brak wsparcia dla mikrofonu");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pl-PL";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.start();

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText((prev: string) => prev + " " + transcript);
    };

    recognitionRef.current = recognition;
  }

  /* ================= SHARE ================= */

  async function shareImage(base64: string) {
    try {
      const blob = await (await fetch(base64)).blob();
      const file = new File([blob], "navimind.png", { type: blob.type });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "NaviMind AI",
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      await navigator.clipboard.writeText(url);

      add({
        role: "assistant",
        content: "🔗 Link skopiowany",
      });

    } catch {
      add({
        role: "assistant",
        content: "❌ Udostępnianie nie działa",
      });
    }
  }

  /* ================= FILE ================= */

  function handleFile(file: File) {
    setPendingFile(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    add({
      role: "assistant",
      content: "📸 Co chcesz zmienić?",
    });
  }

  /* ================= PROCESS ================= */

 async function processFile(file: File, prompt: string) {
  add({
    role: "assistant",
    content:
      file.type === "application/pdf"
        ? "⏳ Przetwarzam PDF..."
        : "⏳ Generuję obraz...",
  });

  let base64: string;

  if (file.type.startsWith("image/")) {
    base64 = await imageToBase64(file, 800, 0.8);
  } else {
    base64 = await fileToBase64(file);
  }

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

  // 🖼️ IMAGE
  if (data.type === "image") {
    const url = `data:image/png;base64,${data.data}`;
    setPreviewUrl(null);
    setSelected(url);
    setPendingFile(null);
    return;
  }

  // 📄 PDF
  if (data.type === "pdf") {
  const url = `data:application/pdf;base64,${data.data}`;

  // 👇 ZAPIS DO STANU zamiast wrzucania w chat
  setSelected(url);
  setPreviewUrl(null);
  setPendingFile(null);

  add({
    role: "assistant",
    content: "📄 Gotowy PDF poniżej",
  });

  return;
}

  // 📝 TEXT
  if (data.type === "text") {
    add({
      role: "assistant",
      content: data.data,
    });

    setPendingFile(null);
  }
}

  /* ================= SEND ================= */

async function send() {
  const raw = text.trim();
  if (!raw) return;

  if (isSending) return;
  setIsSending(true);

  setText("");

  // 📎 FILE FLOW
  if (pendingFile) {
    add({ role: "user", content: raw });

    try {
      await processFile(pendingFile, raw);
    } finally {
      setIsSending(false);
    }

    return;
  }

  setIsTyping(true);

  add({ role: "user", content: raw });
  add({ role: "assistant", content: "Analizuję..." });

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

    const state = useChatStore.getState();
    const messages = [...state.messages];

    const reply =
      data?.reply && data.reply.trim()
        ? data.reply
        : "Coś tu nie zagrało. Spróbuj jeszcze raz.";

    messages[messages.length - 1] = {
    role: "assistant",
    content: reply,
    highlight: data.highlight || null,
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
    setIsSending(false);
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

      <div className="flex justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-blue-600 rounded text-sm"
        >
          📸 Dodaj zdjęcie
        </button>
      </div>

      {previewUrl && (
        <div className="flex justify-center">
          <img src={previewUrl} className="max-w-[200px] rounded" />
        </div>
      )}

    {selected && (
  <div className="flex flex-col items-center gap-2">

    {/* 🖼️ jeśli obraz */}
    {selected.startsWith("data:image") && (
      <img
        src={selected}
        className="max-w-[320px] md:max-w-[420px] max-h-[60vh] object-contain rounded shadow"
      />
    )}

    {/* 📄 jeśli PDF */}
    {selected.startsWith("data:application/pdf") && (
      <iframe
        src={selected}
        className="w-full max-w-[420px] h-[500px] rounded"
      />
    )}

    <div className="flex gap-2 text-xs">

      <a
        href={selected}
        download={selected.includes("pdf") ? "navimind.pdf" : "navimind.png"}
        className="px-2 py-1 bg-white/10 rounded"
      >
        ⬇️ Pobierz
      </a>

      <button
        onClick={() => shareImage(selected)}
        className="px-2 py-1 bg-white/10 rounded"
      >
        🔗 Udostępnij
      </button>

    </div>

  </div>
)}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2"
      >
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          <Plus size={18} />
        </button>

        <button type="button" onClick={startVoice}>
          🎤
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
            placeholder="Napisz co masz na głowie..."
            onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="flex-1 p-3 rounded bg-black/20 resize-none overflow-hidden"
        />

        <button type="submit">➤</button>
      </form>

      {showPro && <ProNotice onClose={() => setShowPro(false)} />}
    </div>
  );
}