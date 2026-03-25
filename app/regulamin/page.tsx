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

      <div className="mt-12 border-t border-white/10 pt-6 text-sm text-white/70">
        <h2 className="text-lg font-semibold text-white mb-2">Kontakt</h2>
        <p>
          W sprawach technicznych i kontaktowych prosimy o wiadomość:
          <br />
          <strong>kontakt.navimind@gmail.com</strong>
        </p>
      </div>
    </main>
  );
}