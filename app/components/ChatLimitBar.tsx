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

function getUidFromUrlClient() {
  try {
    const sp = new URLSearchParams(window.location.search);
    const uid = sp.get("uid");
    return uid && uid.trim().length > 0 ? uid.trim() : null;
  } catch {
    return null;
  }
}

export default function ChatLimitBar() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<LimitResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadLimit() {
    try {
      setLoading(true);

      const uid = getUidFromUrlClient();
      const url = uid ? `/api/limit?uid=${encodeURIComponent(uid)}` : "/api/limit";

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("LimitBar error:", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLimit();

    const tmr = setInterval(loadLimit, 10000);

    const onRefresh = () => loadLimit();
    window.addEventListener("navimind:limit-refresh", onRefresh);

    return () => {
      clearInterval(tmr);
      window.removeEventListener("navimind:limit-refresh", onRefresh);
    };
  }, []);

  const percent = useMemo(() => {
    if (!data) return 0;
    const safeLimit = Math.max(1, data.limit);
    return Math.min(100, Math.round((data.used / safeLimit) * 100));
  }, [data]);

  // ================= LOADING =================
  if (loading && !data) {
    return (
      <div className="mb-2 text-xs text-emerald-300/80">
        {t("checkingLimit")}
      </div>
    );
  }

  // ================= ERROR =================
  if (!data) {
    return (
      <div className="mb-2 text-xs text-emerald-300/80">
        {t("limitLoadFailed")}
      </div>
    );
  }

  const limitReached = !data.allowed;

  return (
    <div className="mb-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
      {/* TOP ROW */}
      <div className="mb-1 flex items-center justify-between gap-2">
        {!limitReached ? (
          <span>
            {t("limitRemaining")} <strong>{data.remaining}</strong> {t("limitOf")} {data.limit} {t("limitDemoSuffix")}
          </span>
        ) : (
          <span className="text-red-300">
            {t("demoLimitReached")} <strong>{formatReset(data.resetAt)}</strong>
          </span>
        )}

        {/* PRIVACY NOTE */}
        <span className="opacity-70">
          {lang === "pl"
            ? "Tryb demo: rozmowa nie jest zapisywana"
            : "Demo mode: conversation is not saved"}
        </span>
      </div>

      {/* PROGRESS BAR */}
      <div className="h-1.5 w-full rounded bg-white/10">
        <div
          className="h-1.5 rounded bg-emerald-400 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
