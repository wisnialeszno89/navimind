"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useChatStore } from "../lib/chatStore";
import { useLanguage } from "../lib/useLanguage";
import MicrophoneButton from "./MicrophoneButton";
import ProNotice from "./ProNotice";
import ImageUploadButton from "./ImageUploadButton";
import { Plus } from "lucide-react";

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

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const add = useChatStore((s) => s.add);
  const plan = useChatStore((s) => s.plan);

  const isPro = plan !== "free";

  const placeholder = useMemo(() => {
    if (locked)
      return lang === "pl"
        ? "Limit demo osiągnięty…"
        : "Demo limit reached…";
    if (isSending)
      return lang === "pl" ? "Wysyłam…" : "Sending…";
    return lang === "pl" ? "Napisz wiadomość…" : "Type a message…";
  }, [locked, isSending, lang]);

  useEffect(() => {
    if (isPro) setLocked(false);
  }, [isPro]);

  async function send() {
    if (locked || isSending) return;

    const raw = text.trim();
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
          Accept: "application/json",
          "x-navimind-uid": uid,
        },
        credentials: "include",
        body: JSON.stringify({ chatId, message: raw, lang }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      const state = useChatStore.getState();
      const next = [...state.messages];

      next[next.length - 1] = {
        role: "assistant",
        content: data?.message || "Brak odpowiedzi",
      };

      state.setMessages(next);

    } catch (e) {
      const state = useChatStore.getState();
      const next = [...state.messages];

      next[next.length - 1] = {
        role: "assistant",
        content:
          lang === "pl"
            ? "Błąd połączenia."
            : "Connection error.",
      };

      state.setMessages(next);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  }

  return (
    <div className="p-3 border-t bg-black">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 p-2 rounded bg-gray-800 text-white"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 rounded text-white"
        >
          ➤
        </button>
      </form>
    </div>
  );
}