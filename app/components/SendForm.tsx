"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useChatStore } from "../lib/chatStore";
import { useLanguage } from "../lib/useLanguage";
import ProNotice from "./ProNotice";
import { Plus } from "lucide-react";
import { imageToBase64 } from "../lib/imageToBase64";
import { useCallback } from "react";

export default function SendForm({ setIsTyping, chatId }: any) {
  const { lang } = useLanguage();

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  const handlePaste = useCallback((e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (!file) return;

      setPendingFile(file);

      add({
        role: "assistant",
        content: "📋 Obraz wklejony. Opisz co chcesz zrobić.",
      });
    }
  }
}, []);

  const file = e.dataTransfer.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    add({
      role: "assistant",
      content: "❌ Obsługiwane tylko obrazy i PDF",
    });
    return;
  }

  setPendingFile(file);

  add({
    role: "assistant",
    content: "📎 Plik dodany. Opisz co chcesz zrobić.",
  });
}, []);

  const add = useChatStore((s) => s.add);
  const plan = useChatStore((s) => s.plan);

  /* ================= LOAD PLAN ================= */

  useEffect(() => {
  // 🔹 PLAN
  fetch("/api/plan")
    .then((res) => res.json())
    .then((data) => {
      useChatStore.setState({ plan: data.plan });
    })
    .catch(() => {});

  // 🔹 PASTE (CTRL+V)
  const handlePasteEvent = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (!file) return;

        setPendingFile(file);

        add({
          role: "assistant",
          content: "📋 Obraz wklejony. Opisz co chcesz zrobić.",
        });
      }
    }
  };

  window.addEventListener("paste", handlePasteEvent);

  return () => {
    window.removeEventListener("paste", handlePasteEvent);
  };
}, []);

  /* ================= MAIN SEND ================= */

  async function send() {
    const raw = text.trim();
    if (!raw) return;

    // 🔒 FREE BLOCK
    if (pendingFile && plan === "free") {
      add({
        role: "assistant",
        content:
          "🔓 Analiza i edycja plików dostępna w PRO. Odblokuj pełną wersję.",
      });
      setShowPro(true);
      return;
    }

    setText("");

    // 🔥 FLOW Z PLIKIEM
    if (pendingFile) {
      add({ role: "user", content: `📎 ${pendingFile.name}` });
      add({ role: "user", content: raw });

      await handleFileProcess(pendingFile, raw);

      setPendingFile(null);
      return;
    }

    // 🔥 NORMAL CHAT
    setIsSending(true);
    setIsTyping(true);

    add({ role: "user", content: raw });
    add({ role: "assistant", content: "" });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: raw }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let fullText = "";
      const assistantIndex = useChatStore.getState().messages.length - 1;

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const payload = JSON.parse(line.replace("data: ", ""));

          if (payload?.delta) {
            fullText += payload.delta;

            const state = useChatStore.getState();
            const next = [...state.messages];
            next[assistantIndex] = {
              role: "assistant",
              content: fullText,
            };
            state.setMessages(next);
          }
        }
      }
    } catch {
      add({ role: "assistant", content: "Błąd połączenia." });
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }

  /* ================= FILE PROCESS ================= */

  async function handleFileProcess(file: File, prompt: string) {
    setIsSending(true);
    setIsTyping(true);

    try {
      let base64 = "";

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

      if (data.type === "image") {
      const url = `data:image/png;base64,${data.data}`;

      add({
        role: "assistant",
      content: `
      ![img](${url})

      📥 Kliknij prawym → "Zapisz obraz jako"
      lub pobierz tutaj:
      <a href="${url}" download="navimind.png">⬇️ Pobierz obraz</a>
    `,
  });

  add({
    role: "assistant",
    content: "✨ Gotowe. Możesz pobrać obraz lub wpisać kolejną zmianę.",
  });
}

      if (data.type === "pdf") {
      const url = `data:application/pdf;base64,${data.data}`;

      add({
      role: "assistant",
      content: `
      📄 PDF gotowy

    <a href="${url}" download="navimind.pdf">⬇️ Pobierz PDF</a>
    `,
  });
}

      if (data.type === "text") {
        add({
          role: "assistant",
          content: data.data,
        });
      }
    } catch {
      add({
        role: "assistant",
        content: "❌ Błąd przetwarzania pliku",
      });
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }

  /* ================= HELPERS ================= */

    function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  /* ================= UI ================= */

  const placeholder = useMemo(() => {
    if (pendingFile) return "Opisz co zrobić z plikiem...";
    if (isSending) return "Wysyłam…";
    return "Napisz wiadomość…";
  }, [isSending, pendingFile]);

  return (
    <div className="sticky bottom-0 z-[9999] border-t bg-[var(--nm-bg-soft)] border-[var(--nm-border-soft)]">

      {/* PREVIEW */}
      {pendingFile && (
      <div className="px-3 pt-2 flex items-center gap-2">
      {pendingFile.type.startsWith("image/") && (
      <img
        src={URL.createObjectURL(pendingFile)}
        className="w-12 h-12 object-cover rounded-lg"
      />
    )}
      <div className="text-sm opacity-80">
      📎 {pendingFile.name}
    </div>
  </div>
)}
      <div className="px-3 text-xs opacity-50">
    Możesz przeciągnąć plik lub wkleić obraz (CTRL+V)
    </div>
      <form
    onSubmit={(e) => {
    e.preventDefault();
    send();
    }}
    onDragOver={(e) => e.preventDefault()}
    onDrop={handleDrop}
    className="flex items-end gap-2 px-3 pt-3"
    >
        {/* PLUS */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20"
        >
          <Plus size={18} />
        </button>

        {/* FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setPendingFile(file);

            add({
              role: "assistant",
              content: "✏️ Opisz co chcesz zrobić z plikiem",
            });
          }}
        />

        {/* TEXT */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          rows={3}
          className="flex-1 resize-none rounded-2xl px-4 py-3 outline-none"
          style={{
            background: "var(--nm-bg-input)",
            border: "1px solid var(--nm-border-input)",
            color: "var(--nm-text-main)",
          }}
        />

        <button
          type="submit"
          className="px-5 py-3 rounded-2xl text-white"
          style={{ background: "var(--nm-accent)" }}
        >
          ➤
        </button>
      </form>

      {showPro && <ProNotice onClose={() => setShowPro(false)} />}
    </div>
  );
}