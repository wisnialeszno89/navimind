"use client";

import { useLanguage } from "../lib/useLanguage";

export default function LangSwitch() {
  const { lang, t } = useLanguage();
  const { setLang } = useLanguage() as any; // ⬅️ bezpieczne obejście TS

  const nextLang = lang === "pl" ? "en" : "pl";

  return (
    <button
      onClick={() => setLang(nextLang)}
      className="text-sm hover:opacity-80 transition"
      title={`Zmień język na ${nextLang === "en" ? "English" : "Polski"}`}
    >
      {nextLang === "en" ? "🇬🇧" : "🇵🇱"}
    </button>
  );
}