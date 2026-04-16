"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "../lib/chatStore";
import { useLanguage } from "../lib/useLanguage";

type UsagePayload = {
  plan: "free" | "pro" | "pro_plus";
  limits: {
    dailyFiles: number;
    monthlyPdf: number;
    monthlyFiles: number;
  };
  usage: {
    daily: {
      used: number;
      left: number;
      resetAt: number;
    };
    monthly: {
      pdf: {
        allowed: boolean;
        used: number;
        remaining: number;
        resetAt: number;
        limit: number;
      };
      images: {
        allowed: boolean;
        used: number;
        remaining: number;
        resetAt: number;
        limit: number;
      };
    };
  };
};

function fmtReset(ts: number, lang: "pl" | "en") {
  const diff = ts - Date.now();
  if (!ts || diff <= 0) return lang === "pl" ? "teraz" : "now";

  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(mins / 60);
  const restMins = mins % 60;

  if (hours <= 0) return lang === "pl" ? `${mins} min` : `${mins} min`;
  return lang === "pl"
    ? `${hours}h ${restMins}m`
    : `${hours}h ${restMins}m`;
}

function Bar({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const safeLimit = Math.max(1, limit);
  const pct = Math.min(100, Math.max(0, Math.round((used / safeLimit) * 100)));

  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-yellow-500/40"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function UsagePanel() {
  const { lang } = useLanguage();

  const plan = useChatStore((s) => s.plan);

  const [data, setData] = useState<UsagePayload | null>(null);
  const [loading, setLoading] = useState(false);

  const isPro = plan !== "free";

  async function load() {
    if (!isPro) return;

    try {
      setLoading(true);
      const res = await fetch("/api/usage", { cache: "no-store" });
      if (!res.ok) return;

      const json = (await res.json()) as UsagePayload;
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  if (!isPro) return null;

  const dailyUsed = data?.usage?.daily?.used ?? 0;
  const dailyLeft = data?.usage?.daily?.left ?? 0;
  const dailyLimit = data?.limits?.dailyFiles ?? dailyUsed + dailyLeft;
  const dailyResetAt = data?.usage?.daily?.resetAt ?? 0;

  const pdfUsed = data?.usage?.monthly?.pdf?.used ?? 0;
  const pdfLimit = data?.usage?.monthly?.pdf?.limit ?? data?.limits?.monthlyPdf ?? 0;
  const pdfRemaining = data?.usage?.monthly?.pdf?.remaining ?? 0;
  const pdfResetAt = data?.usage?.monthly?.pdf?.resetAt ?? 0;

  const imgUsed = data?.usage?.monthly?.images?.used ?? 0;
  const imgLimit = data?.usage?.monthly?.images?.limit ?? data?.limits?.monthlyFiles ?? 0;
  const imgRemaining = data?.usage?.monthly?.images?.remaining ?? 0;
  const imgResetAt = data?.usage?.monthly?.images?.resetAt ?? 0;

  const planLabel = plan === "pro_plus" ? "PRO+" : "PRO";

  return (
    <div className="border-t border-white/10 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-white/70">
          {lang === "pl" ? "Użycie (PRO)" : "Usage (PRO)"}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/70">
            {planLabel}
          </div>

          <button
            onClick={() => load()}
            className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 transition"
          >
            {loading ? (lang === "pl" ? "..." : "...") : lang === "pl" ? "Odśwież" : "Refresh"}
          </button>
        </div>
      </div>

      {/* DAILY */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-white/70 mb-2">
          <div>{lang === "pl" ? "Wiadomości dziennie" : "Daily messages"}</div>
          <div className="text-white/50">
            {dailyUsed}/{dailyLimit}
          </div>
        </div>

        <Bar used={dailyUsed} limit={dailyLimit} />

        <div className="mt-2 text-[11px] text-white/45 flex items-center justify-between">
          <div>
            {lang === "pl" ? "Pozostało:" : "Remaining:"}{" "}
            <span className="text-white/70">{dailyLeft}</span>
          </div>
          <div>
            {lang === "pl" ? "Reset:" : "Reset:"}{" "}
            <span className="text-white/70">{fmtReset(dailyResetAt, lang)}</span>
          </div>
        </div>
      </div>

      {/* MONTHLY */}
      <div className="grid grid-cols-2 gap-3">
        {/* PDF */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/70">
              {lang === "pl" ? "PDF / miesiąc" : "PDF / month"}
            </div>
            <div className="text-[11px] text-white/50">
              {pdfUsed}/{pdfLimit}
            </div>
          </div>

          <Bar used={pdfUsed} limit={pdfLimit || 1} />

          <div className="mt-2 text-[11px] text-white/45">
            <div>
              {lang === "pl" ? "Pozostało:" : "Remaining:"}{" "}
              <span className="text-white/70">{pdfRemaining}</span>
            </div>
            <div className="mt-1">
              {lang === "pl" ? "Reset:" : "Reset:"}{" "}
              <span className="text-white/70">{fmtReset(pdfResetAt, lang)}</span>
            </div>
          </div>
        </div>

        {/* IMAGES */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/70">
              {lang === "pl" ? "Zdjęcia / miesiąc" : "Images / month"}
            </div>
            <div className="text-[11px] text-white/50">
              {imgUsed}/{imgLimit}
            </div>
          </div>

          <Bar used={imgUsed} limit={imgLimit || 1} />

          <div className="mt-2 text-[11px] text-white/45">
            <div>
              {lang === "pl" ? "Pozostało:" : "Remaining:"}{" "}
              <span className="text-white/70">{imgRemaining}</span>
            </div>
            <div className="mt-1">
              {lang === "pl" ? "Reset:" : "Reset:"}{" "}
              <span className="text-white/70">{fmtReset(imgResetAt, lang)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* hint */}
      <div className="mt-3 text-[11px] text-white/35">
        {lang === "pl"
          ? "Limity są po to, żeby nie było kosztowego armagedonu 😄"
          : "Limits exist to avoid cost chaos 😄"}
      </div>
    </div>
  );
}