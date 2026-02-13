"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { Crown } from "lucide-react";
import { getWelcomeMessage } from "../lib/welcomeMessages";

import { useChatStore } from "../lib/chatStore";
import { useLanguage } from "../lib/useLanguage";

import SendForm from "./SendForm";
import TypingIndicator from "./TypingIndicator";
import ChatLimitBar from "./ChatLimitBar";
import CrisisHelp from "./CrisisHelp";

type Level = "none" | "low" | "medium" | "high";

export default function ChatWindow() {
  const { lang } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(false);

  const messages = useChatStore((s) => s.messages);
  const setPlan = useChatStore((s) => s.setPlan);
  const plan = useChatStore((s) => s.plan);
  const activeChatId = useChatStore((s) => s.activeChatId);

  const [isTyping, setIsTyping] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<Level>("none");

  const endRef = useRef<HTMLDivElement | null>(null);

  const planLabel = plan === "free" ? "FREE" : plan === "pro" ? "PRO" : "PRO+";

  /* LOAD PLAN */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pro", { cache: "no-store" });
        const data = await res.json();
        setPlan(data?.plan ?? "free");
      } catch {
        setPlan("free");
      }
    })();
  }, [setPlan]);

  /* AUTO SCROLL */
  /* ENTRY SILENCE — 600 ms */
useEffect(() => {
  if (messages.length > 0) return;

  const t = setTimeout(() => setShowWelcome(true), 600);
  return () => clearTimeout(t);
}, [messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden bg-[var(--nm-bg-main)] nm-breath-bg">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--nm-border-soft)] bg-[var(--nm-bg-soft)]">
        <div className="text-sm text-[var(--nm-accent-warm)]">
          🔒 {lang === "pl" ? "Rozmowa prywatna" : "Private chat"}
        </div>

        <Link
          href="/pro"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
            plan === "free"
              ? "bg-[var(--nm-pro-gold-soft)] text-[var(--nm-pro-gold)] hover:opacity-90"
              : "bg-[var(--nm-pro-gold)] text-black"
          }`}
        >
          <Crown size={12} />
          {planLabel}
        </Link>
      </div>

      {/* DEMO LIMIT */}
      {plan === "free" && (
        <div className="px-4 py-2 border-b border-[var(--nm-border-soft)] bg-[var(--nm-bg-soft)]">
          <ChatLimitBar />
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {/* ⭐ WELCOME MESSAGE — tylko gdy brak rozmowy */}
        {messages.length === 0 && showWelcome && (
          <div
            className="max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm"
            style={{
              background: "var(--nm-assistant-bg)",
              border: "1px solid var(--nm-border-soft)",
              color: "var(--nm-text-main)",
            }}
          >
            {getWelcomeMessage(lang)}
          </div>
        )}

        {/* 💬 NORMAL MESSAGES */}
        {messages.map((m, i) => (
          <div
            key={i}
            className="max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm nm-fade-in"
            style={
              m.role === "user"
                ? {
                    background: "var(--nm-user-gradient)",
                    color: "white",
                    marginLeft: "auto",
                  }
                : {
                    background: "var(--nm-assistant-bg)",
                    border: "1px solid var(--nm-border-soft)",
                    color: "var(--nm-text-main)",
                  }
            }
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.content}
            </ReactMarkdown>
          </div>
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* CRISIS */}
      {crisisLevel === "high" && <CrisisHelp lang={lang} />}

      {/* INPUT */}
      <SendForm
        setIsTyping={setIsTyping}
        setCrisisLevel={setCrisisLevel}
        chatId={activeChatId}
      />
    </div>
  );
}