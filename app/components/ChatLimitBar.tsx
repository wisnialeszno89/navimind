"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../lib/useLanguage";

type LimitResult = {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  resetAt: number;
};

function formatReset(resetAt: number) {
  const diff = resetAt - Date.now();
  if (diff <= 0) return "now";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours <= 0) return `${mins} min`;
  return `${hours}h ${mins}m`;
}

export default function ChatLimitBar() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<LimitResult | null>(null);

  async function loadLimit() {
    try {
      const res = await fetch("/api/limit", {
    cache: "no-store",
    credentials: "include",
  });

      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("LimitBar error:", e);
    }
  }

 useEffect(() => {
  loadLimit();

  // 🔁 fallback (może zostać, ale rzadziej)
  const tmr = setInterval(loadLimit, 15000);

  // 🔥 KLUCZ — natychmiastowy refresh po wiadomości
  const handler = () => loadLimit();
  window.addEventListener("limit-refresh", handler);

  return () => {
    clearInterval(tmr);
    window.removeEventListener("limit-refresh", handler);
  };
  }, []);

  const percent = useMemo(() => {
    if (!data) return 0;
    return Math.min(100, Math.round((data.used / data.limit) * 100));
  }, [data]);

  if (!data) return null;

  const limitReached = !data.allowed;

  return (
    <div className="mb-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
      <div className="mb-1 flex items-center justify-between gap-2">
        {!limitReached ? (
          <span>
            {t("limitRemaining")} <strong>{data.remaining}</strong>{" "}
            {t("limitOf")} {data.limit}
          </span>
        ) : (
          <span className="text-red-300">
            {t("demoLimitReached")}{" "}
            <strong>{formatReset(data.resetAt)}</strong>
          </span>
        )}

        <span className="opacity-70">
          {lang === "pl"
            ? "Tryb demo"
            : "Demo mode"}
        </span>
      </div>

      <div className="h-1.5 w-full rounded bg-white/10">
        <div
          className="h-1.5 rounded bg-emerald-400 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}