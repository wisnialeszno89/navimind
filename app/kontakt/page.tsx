"use client";

import AppShell from "../components/AppShell";
import { useLanguage } from "../lib/useLanguage";

export const dynamic = "force-dynamic";

export default function KontaktPage() {
  const { lang } = useLanguage();

  return (
    <AppShell>
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xl w-full text-center">
          <h1 className="text-2xl font-semibold mb-4">
            {lang === "pl" ? "Kontakt" : "Contact"}
          </h1>

          <p className="text-white/70">
            {lang === "pl"
              ? "W sprawach kontaktowych napisz na:"
              : "For contact please email:"}
          </p>

          <p className="mt-2 text-lg font-semibold">
            kontakt.navimind@gmail.com
          </p>

          <p className="mt-6 text-sm text-white/50">
            {lang === "pl"
              ? "Odpowiedź zazwyczaj w ciągu 24h"
              : "Response usually within 24h"}
          </p>
        </div>
      </main>
    </AppShell>
  );
}