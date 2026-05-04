"use client";

import Link from "next/link";
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
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* LOGO / NAZWA */}
        <div
          className="text-sm tracking-wide"
          style={{ color: "var(--nm-text-soft)" }}
        >
          NaviMind
        </div>

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

          {/* ⭐ PRO / UPGRADE */}
          <Link
            href="/pro"
            className="text-xs px-3 py-1.5 rounded-full border transition"
            style={{
              borderColor: "var(--nm-pro-gold)",
              color: "var(--nm-pro-gold)",
              background: "var(--nm-pro-gold-soft)",
            }}
          >
            ⭐ {isFree ? "UPGRADE" : "PRO"}
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