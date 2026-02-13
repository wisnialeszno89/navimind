"use client";

import { useLanguage } from "../lib/useLanguage";
import { TermsPL } from "../legal/terms.pl";
import { TermsEN } from "../legal/terms.en";

export const dynamic = "force-dynamic";

export default function RegulaminPage() {
  const { lang } = useLanguage();

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 text-base md:text-lg leading-relaxed text-white">
      {lang === "pl" ? <TermsPL /> : <TermsEN />}
    </main>
  );
}