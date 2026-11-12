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
      className="nm-public-header w-full border-b"
      style={{
        borderColor: "var(--nm-border-soft)",
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0))",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* LOGO / NAZWA */}
        <Link href="/"
          className="nm-brand text-base font-bold tracking-tight"
          style={{ color: "var(--nm-text-soft)" }}
        >
          NaviMind
        </Link>

        {/* PRAWA STRONA */}
        <div className="flex items-center gap-3">

          {/* REGULAMIN */}
          <Link
            href="/regulamin"
            className="nm-legal-link text-[11px] uppercase tracking-wide text-white/40 hover:text-white/70 transition"
          >
            REGULAMIN
          </Link>

          {/* FREE badge */}
          {isFree && (
            <div
              className="nm-free-badge text-xs px-2 py-1 rounded-full border"
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
            className="nm-nav-link inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs transition"
          >
            <Bot size={15} /> Agent
          </Link>

          <Link
            href="/plans"
            className="nm-nav-link nm-nav-highlight inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs transition"
            
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