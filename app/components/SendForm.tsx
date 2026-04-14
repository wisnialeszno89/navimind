"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useChatStore } from "../lib/chatStore";
import { useLanguage } from "../lib/useLanguage";
import MicrophoneButton from "./MicrophoneButton";
import ProNotice from "./ProNotice";
import { Plus, ImageIcon, FileText } from "lucide-react";

type Level = "none" | "low" | "medium" | "high";

function getOrCreateLocalUid() {
  if (typeof window === "undefined") return "";

  let uid = localStorage.getItem("nm_uid");

  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem("nm_uid", uid);
  }

  return uid;
}

export default function SendForm({
  setIsTyping,
  setCrisisLevel,
  chatId,
}: {
  setIsTyping: (v: boolean) => void;
  setCrisisLevel: (v: Level) => void;
  chatId?: string | null;
}) {
  const { lang } = useLanguage();

  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const add = useChatStore((s) => s.add);
  const plan = useChatStore((s) => s.plan);

  const isPro = plan !== "free";

  const placeholder = useMemo(() => {
    if (locked) return lang === "pl" ? "Limit demo osiągnięty…" : "Demo limit reached…";
    if (isSending) return lang === "pl" ? "Wysyłam…" : "Sending…";
    return lang === "pl" ? "Napisz wiadomość…" : "Type a message…";
  }, [locked, isSending, lang]);

  useEffect(() => {
    if (isPro) setLocked(false);
  }, [isPro]);

  async function send(custom?: string) {
    if (pdfFile) return sendPdf();
    if (imageFile) return sendImage();

    if (locked || isSending) return;

    const raw = (custom ?? text).trim();
    if (!raw) return;

    const uid = getOrCreateLocalUid();

    setText("");
    setIsSending(true);
    setIsTyping(true);

    add({ role: "user", content: raw });
    add({ role: "assistant", content: "" });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "x-navimind-uid": uid,
        },
        body: JSON.stringify({ chatId, message: raw, lang }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let fullText = "";
      const assistantIndex = useChatStore.getState().messages.length - 1;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const chunk of parts) {
          if (!chunk.startsWith("data:")) continue;

          const payload = JSON.parse(chunk.replace(/^data:\s*/, ""));

          if (payload?.type === "delta") {
            fullText += payload.delta || "";

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
      add({
        role: "assistant",
        content: lang === "pl" ? "Błąd połączenia." : "Connection error.",
      });
    } finally {
      setIsTyping(false);
      setIsSending(false);
      setLocked(false);
    }
  }

  async function sendPdf(file?: File) {
    const f = file ?? pdfFile;
    if (!f) return;

    setIsSending(true);
    setIsTyping(true);

    const formData = new FormData();
    formData.append("file", f);
    formData.append("mode", "summary");

    try {
      const res = await fetch("/api/pdf-v2", { method: "POST", body: formData });
      const data = await res.json();

      add({ role: "user", content: "📄 PDF" });
      add({ role: "assistant", content: data.result || "Brak odpowiedzi" });
    } catch {
      add({ role: "assistant", content: "Błąd analizy PDF" });
    } finally {
      setPdfFile(null);
      setIsSending(false);
      setIsTyping(false);
    }
  }

  async function sendImage(file?: File) {
    const f = file ?? imageFile;
    if (!f) return;

    setIsSending(true);
    setIsTyping(true);

    const formData = new FormData();
    formData.append("image", f);

    try {
      const res = await fetch("/api/vision-v2", { method: "POST", body: formData });
      const data = await res.json();

      add({ role: "user", content: "📷 Zdjęcie" });
      add({ role: "assistant", content: data.message || "Brak opisu" });
    } catch {
      add({ role: "assistant", content: "Błąd analizy obrazu" });
    } finally {
      setImageFile(null);
      setIsSending(false);
      setIsTyping(false);
    }
  }

  return (
    <div className="sticky bottom-0 z-[9999] border-t bg-[var(--nm-bg-soft)] border-[var(--nm-border-soft)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 px-3 pt-3 relative"
      >
        {/* PLUS + MENU */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachments((v) => !v)}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10"
          >
            <Plus size={18} />
          </button>

          {showAttachments && (
            <div className="absolute bottom-16 left-0 z-[9999] flex flex-col gap-2 backdrop-blur-md bg-black/70 p-3 rounded-2xl shadow-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  imageInputRef.current?.click();
                  setShowAttachments(false);
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/10 transition"
              >
                <ImageIcon size={18} />
                <span className="text-sm">Zdjęcie</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  pdfInputRef.current?.click();
                  setShowAttachments(false);
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/10 transition"
              >
                <FileText size={18} />
                <span className="text-sm">PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* 🎤 MIKROFON */}
        <MicrophoneButton onResult={(t) => setText(t)} />

        {/* INPUTY */}
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) sendPdf(file);
          }}
        />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) sendImage(file);
          }}
        />

        {/* TEXTAREA */}
        <textarea
          ref={textareaRef}
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
          className="flex-1 resize-none rounded-2xl px-4 py-3 outline-none min-h-[70px]"
          style={{
            background: "var(--nm-bg-input)",
            border: "1px solid var(--nm-border-input)",
            color: "var(--nm-text-main)",
          }}
        />

        {/* SEND */}
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