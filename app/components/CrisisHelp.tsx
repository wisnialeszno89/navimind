"use client";

import { useEffect, useState } from "react";

type Hotline = {
  name: string;
  phone: string;
  note?: string;
};

export default function CrisisHelp({ lang }: { lang: "pl" | "en" }) {
  const [hotline, setHotline] = useState<Hotline | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/hotline", { cache: "no-store" });
        const data = await res.json();
        setHotline(data?.hotline ?? null);
      } catch {}
    })();
  }, []);

  if (!hotline) return null;

  const phoneHref = `tel:${hotline.phone.replace(/\s/g, "")}`;

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-white space-y-3">

      {/* TEXT */}
      <div className="leading-relaxed">
        {lang === "pl" ? (
          <>
            Wygląda na to, że możesz przechodzić przez bardzo trudny moment.  
            Nie musisz być z tym sam.  
            Możesz skontaktować się z bezpłatną linią wsparcia:
          </>
        ) : (
          <>
            It looks like you may be going through a very difficult moment.  
            You don’t have to be alone with this.  
            You can contact a free support line:
          </>
        )}
      </div>

      {/* HOTLINE INFO */}
      <div className="text-white/90">
        <div className="font-semibold">{hotline.name}</div>
        <div className="text-lg tracking-wide">{hotline.phone}</div>
        {hotline.note && (
          <div className="text-xs text-white/60">{hotline.note}</div>
        )}
      </div>

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">

        {/* SAVE NUMBER */}
        <a
          href={phoneHref}
          className="flex-1 text-center rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 transition"
        >
          {lang === "pl" ? "Zapisz numer w telefonie" : "Save number"}
        </a>

        {/* CALL NOW */}
        <a
          href={phoneHref}
          className="flex-1 text-center rounded-xl px-4 py-2 bg-red-500 hover:bg-red-400 transition text-white font-medium"
        >
          {lang === "pl" ? "Zadzwoń teraz" : "Call now"}
        </a>
      </div>
    </div>
  );
}
