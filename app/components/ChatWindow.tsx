"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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

type Props = {
  initialContext?: {
    tryb?: string;
    sciezka?: string;
    from?: string;
  };
};

export default function ChatWindow({ initialContext }: Props) {
  const { lang } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(false);

  const messages = useChatStore((s) => s.messages);
  const setPlan = useChatStore((s) => s.setPlan);
  const plan = useChatStore((s) => s.plan);
  const activeChatId = useChatStore((s) => s.activeChatId);

  const [isTyping, setIsTyping] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<Level>("none");

  const endRef = useRef<HTMLDivElement | null>(null);

  const planLabel =
    plan === "free" ? "FREE" : plan === "pro" ? "PRO" : "PRO+";

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

  /* KONTEKST Z MENMIND — TYLKO JAKO STARTOWA WIADOMOŚĆ */
  const contextMessage = useMemo(() => {
    if (!initialContext) return null;
    if (initialContext.from !== "menmind") return null;
    if (messages.length > 0) return null;

    if (initialContext.sciezka === "rozstanie") {
      return lang === "pl"
        ? "Widzę, że jesteś na ścieżce rozstania. Ułóżmy plan 7 dni stabilizacji: sen, brak kontaktu, ruch, brak alkoholu."
        : "I see you're on the breakup path. Let's build a 7-day stabilization plan.";
    }

    if (initialContext.tryb === "kryzys") {
      return lang === "pl"
        ? "Jesteś w trybie kryzysu. Skupimy się na stabilizacji i małych krokach."
        : "You're in crisis mode. We'll focus on stabilization and small steps.";
    }

    return null;
  }, [initialContext, messages.length, lang]);

  /* ENTRY SILENCE */
  useEffect(() => {
    if (messages.length > 0 || contextMessage) return;

    const t = setTimeout(() => setShowWelcome(true), 600);
    return () => clearTimeout(t);
  }, [messages.length, contextMessage]);

  /* AUTO SCROLL */
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
        {/* KONTEKSTOWA WIADOMOŚĆ */}
        {contextMessage && (
          <div
            className="max-w-[88%] md:max-w-[75%] rounded-2xl px-4 py-3 text-[16px] md:text-[17px] leading-8 font-medium shadow-sm"
            style={{
              background: "var(--nm-assistant-bg)",
              border: "1px solid var(--nm-border-soft)",
              color: "var(--nm-text-main)",
            }}
          >
            {contextMessage}
          </div>
        )}

        {/* ZWYKŁY WELCOME */}
        {messages.length === 0 && showWelcome && !contextMessage && (
          <div
            className="max-w-[88%] md:max-w-[75%] rounded-2xl px-4 py-3 text-[16px] md:text-[17px] leading-8 font-medium shadow-sm"
            style={{
              background: "var(--nm-assistant-bg)",
              border: "1px solid var(--nm-border-soft)",
              color: "var(--nm-text-main)",
            }}
          >
            {getWelcomeMessage(lang)}
          </div>
        )}

        {/* NORMALNE WIADOMOŚCI */}
        {messages.map((m, i) => (
          <div
            key={i}
            className="max-w-[88%] md:max-w-[75%] rounded-2xl px-4 py-3 text-[16px] md:text-[17px] leading-8 font-medium shadow-sm nm-fade-in"
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

      {crisisLevel === "high" && <CrisisHelp lang={lang} />}

      <SendForm
        setIsTyping={setIsTyping}
        setCrisisLevel={setCrisisLevel}
        chatId={activeChatId}
      />
    </div>
  );
}