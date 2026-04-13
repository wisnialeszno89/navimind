"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useChatStore } from "../lib/chatStore";
import { useLanguage } from "../lib/useLanguage";
import MicrophoneButton from "./MicrophoneButton";
import ProNotice from "./ProNotice";
import UploadButton from "./UploadButton";
import ImageUploadButton from "./ImageUploadButton";
import { Plus } from "lucide-react";
import { imageToBase64 } from "../lib/imageToBase64";

type Level = "none" | "low" | "medium" | "high";

/* ===============================
   🔥 GLOBAL UID (WSPÓLNY LIMIT)
================================ */

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
}) 
{
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

  async function handleImageUpload(file: File) {
  console.log("🔥 IMAGE CLICK");

  try {
    setIsTyping(true);

    const base64 = await imageToBase64(file);

    const res = await fetch("/api/vision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        image: base64,
      }),
    });

    console.log("STATUS:", res.status);

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.log("ERROR:", err);

      if (err?.error === "PRO_REQUIRED") {
        alert("Zdjęcia są dostępne w PRO.");
        return;
      }

      if (err?.error === "IMAGE_LIMIT") {
        alert("Limit zdjęć został osiągnięty.");
        return;
      }

      throw new Error("Upload failed");
    }

    const data = await res.json();

    console.log("VISION RESULT:", data);

    add({
      role: "assistant",
      content: data.message,
    });

  } catch (e) {
    console.error("UPLOAD ERROR:", e);

    add({
      role: "assistant",
      content: "Błąd analizy zdjęcia.",
    });
  } finally {
    setIsTyping(false);
  }
}

  async function send(custom?: string) {
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
          "x-navimind-uid": uid, // 🔥 KLUCZOWE
        },
        body: JSON.stringify({ chatId, message: raw, lang }),
      });

      if (res.status === 429) {
        setLocked(true);
        window.dispatchEvent(new Event("navimind:limit-refresh"));
        return;
      }

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let fullText = "";
      const assistantIndex =
        useChatStore.getState().messages.length - 1;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const chunk of parts) {
          if (!chunk.startsWith("data:")) continue;

          const payload = JSON.parse(
            chunk.replace(/^data:\s*/, "")
          );

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
      
      // 🔥 odświeżamy limit po każdej wiadomości
      window.dispatchEvent(new Event("navimind:limit-refresh"));

    } catch {
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
  <div className="sticky bottom-0 z-50 border-t bg-[var(--nm-bg-soft)] border-[var(--nm-border-soft)] relative">

    <div className="absolute -top-5 left-0 right-0 text-center text-[10px] text-white/30 pointer-events-auto">
      <a href="/regulamin" className="hover:text-white/60">
        regulamin
      </a>
      <span className="mx-1">•</span>
      <a href="/prywatnosc" className="hover:text-white/60">
        prywatność
      </a>
    </div>

    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="flex items-end gap-2 px-3 pt-3"
    >
        {/* PLUS */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setShowAttachments((v) => !v)
            }
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <Plus size={18} />
          </button>

          {showAttachments && (
            <div className="absolute bottom-14 left-0 flex flex-col gap-2 bg-[var(--nm-bg-soft)] border border-[var(--nm-border-soft)] rounded-xl p-3 shadow-xl">
              {isPro ? (
                <>
                  <UploadButton onUpload={() => {}} />
                  <ImageUploadButton onUpload={handleImageUpload} />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPro(true)}
                  className="text-sm text-white/60"
                >
                  Dostępne w PRO
                </button>
              )}
            </div>
          )}
        </div>

        <MicrophoneButton onResult={(t) => setText(t)} />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const el = textareaRef.current;
            if (el) {
              el.style.height = "auto";
              el.style.height =
                el.scrollHeight + "px";
            }
          }}
          disabled={locked || isSending}
          placeholder={placeholder}
          rows={3}
          className="flex-1 resize-none rounded-2xl px-4 py-3 outline-none min-h-[70px] max-h-[200px] overflow-y-auto"
          style={{
            background: "var(--nm-bg-input)",
            border: "1px solid var(--nm-border-input)",
            color: "var(--nm-text-main)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />

        <button
          type="submit"
          disabled={locked || isSending}
          className="px-5 py-3 rounded-2xl text-white nm-btn"
          style={{ background: "var(--nm-accent)" }}
        >
          ➤
        </button>
      </form>

      {showPro && (
        <ProNotice onClose={() => setShowPro(false)} />
      )}

      <div
        className="px-4 pt-2 text-[11px] text-center"
        style={{ color: "var(--nm-text-muted)" }}
      >
        <div className="text-[10px] text-center text-white/30 mt-1">
        <a href="/regulamin" className="hover:text-white/60">
        regulamin
        </a>
        <span className="mx-1">•</span>
        <a href="/prywatnosc" className="hover:text-white/60">
         prywatność
        </a>
      </div>
        {lang === "pl"
          ? "To miejsce jest prywatne. Możesz napisać to, co chcesz."
          : "This space is private. You can write whatever you want."}
      </div>

      <div className="pb-[calc(env(safe-area-inset-bottom)+10px)]" />
    </div>
  );
}