"use client";

import Link from "next/link";
import { useLanguage } from "../lib/useLanguage";

export default function ProNotice() {
  const { lang } = useLanguage();

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-left">
      <div className="text-sm font-semibold text-white mb-1">
        {lang === "pl" ? "PRO" : "PRO"}
      </div>

      <p className="text-sm text-blue-200/80 leading-relaxed">
        {lang === "pl"
          ? "Odblokuj historię rozmów, większy limit i funkcje PDF / zdjęć."
          : "Unlock chat history, higher limits, and PDF / image features."}
      </p>

      <Link
        href="/pro"
        className="mt-3 inline-block text-sm text-blue-300 hover:text-blue-200 transition"
      >
        {lang === "pl" ? "Przejdź do PRO →" : "Go to PRO →"}
      </Link>
    </div>
  );
}