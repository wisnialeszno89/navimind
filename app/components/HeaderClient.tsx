"use client";

import Link from "next/link";
import { Bot, CreditCard } from "lucide-react";
import { useChatStore } from "../lib/chatStore";

export default function HeaderClient() {
  const plan = useChatStore((s) => s.plan);

  const isFree = plan === "free";

  // 🔥 LOGOUT
  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout error:", e);
    }

    // odśwież appkę (czyści stan + pobiera nowy plan)
    window.location.reload();
  }

  return (
    <div
      className="w-full border-b"
      style={{
        borderColor: "var(--nm-border-soft)",
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0))",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* LOGO / NAZWA */}
        <Link href="/"
          className="text-sm tracking-wide"
          style={{ color: "var(--nm-text-soft)" }}
        >
          NaviMind
        </Link>

        {/* PRAWA STRONA */}
        <div className="flex items-center gap-3">

          {/* REGULAMIN */}
          <Link
            href="/regulamin"
            className="text-[11px] uppercase tracking-wide text-white/40 hover:text-white/70 transition"
          >
            REGULAMIN
          </Link>

          {/* FREE badge */}
          {isFree && (
            <div
              className="text-xs px-2 py-1 rounded-full border"
              style={{
                borderColor: "var(--nm-border-soft)",
                color: "var(--nm-text-muted)",
              }}
            >
              FREE
            </div>
          )}

          <Link
            href="/agent"
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-xs text-blue-100 transition hover:bg-blue-400/20"
          >
            <Bot size={15} /> Agent
          </Link>

          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs transition hover:bg-white/10"
            style={{ borderColor: "var(--nm-pro-gold)", color: "var(--nm-pro-gold)", background: "var(--nm-pro-gold-soft)" }}
          >
            <CreditCard size={15} /> Wybierz swój pakiet
          </Link>

          {/* 🚪 LOGOUT (tylko jeśli zalogowany / PRO) */}
          {!isFree && (
            <button
              onClick={logout}
              className="text-[11px] uppercase tracking-wide text-white/40 hover:text-white/80 transition"
            >
              WYLOGUJ
            </button>
          )}

        </div>
      </div>
    </div>
  );
}