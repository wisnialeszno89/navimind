"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { Crown } from "lucide-react";

import { getWelcomeMessage } from "../lib/welcomeMessages";
import { useChatStore } from "../lib/chatStore";
import { useLanguage } from "../lib/useLanguage";
import { extractOptions } from "../lib/nextStepEngine";

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

  const messages = useChatStore((s) => s.messages);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const progress = useChatStore((s) => s.progress);

  const toggleProgress = useChatStore((s) => s.toggleProgress);
  const removeProgress = useChatStore((s) => s.removeProgress);

  const [plan, setPlan] = useState<"free" | "pro" | "pro_plus">("free");
  const [showWelcome, setShowWelcome] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<Level>("none");

  const endRef = useRef<HTMLDivElement | null>(null);

  const planLabel =
    plan === "free" ? "FREE" : plan === "pro" ? "PRO" : "PRO+";

  /* PLAN */
  useEffect(() => {
    fetch("/api/pro", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.plan) setPlan(data.plan);
      })
      .catch(() => setPlan("free"));
  }, []);

  /* CONTEXT */
  const contextMessage = useMemo(() => {
    if (!initialContext) return null;
    if (initialContext.from !== "menmind") return null;
    if (messages.length > 0) return null;

    if (initialContext.sciezka === "rozstanie") {
      return "Widzę, że jesteś na ścieżce rozstania. Ułóżmy plan 7 dni stabilizacji.";
    }

    if (initialContext.tryb === "kryzys") {
      return "Jesteś w trybie kryzysu. Skupiamy się na małych krokach.";
    }

    return null;
  }, [initialContext, messages.length]);

  /* ENTRY */
  useEffect(() => {
    if (messages.length > 0 || contextMessage) return;
    const t = setTimeout(() => setShowWelcome(true), 600);
    return () => clearTimeout(t);
  }, [messages.length, contextMessage]);

  /* SCROLL */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden bg-[var(--nm-bg-main)]">

      {/* TOP */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="text-sm opacity-70">
          🔒 {lang === "pl" ? "Rozmowa prywatna" : "Private chat"}
        </div>

        <Link
          href="/pro"
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            plan === "free"
              ? "bg-yellow-200 text-black"
              : "bg-yellow-400 text-black"
          }`}
        >
          <Crown size={12} />
          {planLabel}
        </Link>
      </div>

      {/* LIMIT */}
      {plan === "free" && <ChatLimitBar />}

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">

        {contextMessage && (
          <div className="bg-white/10 p-3 rounded-xl">
            {contextMessage}
          </div>
        )}

        {messages.length === 0 && showWelcome && !contextMessage && (
          <div className="bg-white/10 p-3 rounded-xl">
            {getWelcomeMessage(lang)}
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const options = extractOptions(m.content);

          return (
            <div
              key={i}
              className={`p-3 rounded-xl ${
                isUser ? "bg-blue-500 text-white ml-auto" : "bg-white/10"
              }`}
            >
              {options.length > 0 && !isUser ? (
                <div className="flex flex-col gap-2">
                  {options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const clean = opt.replace(/^\d+\.\s*/, "");
                        window.dispatchEvent(
                          new CustomEvent("quick-send", { detail: clean })
                        );
                      }}
                      className="text-left p-2 rounded bg-white/10 hover:bg-white/20"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          );
        })}

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