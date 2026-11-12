"use client";

import { useRouter } from "next/navigation";
import AppShell from "./components/AppShell";
import Link from "next/link";
import { useLanguage } from "./lib/useLanguage";

export default function Page() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center text-center gap-6 flex-1 px-6">
        {/* BRAND / NAZWA - największa */}
        <h1 className="text-6xl font-bold leading-none tracking-tight">
          <span className="text-white">Navi</span>
          <span className="text-blue-500">Mind</span>
        </h1>

        {/* TREŚĆ - cieplejsza i subtelniejsza */}
        <div className="max-w-xl space-y-3">
          {/* główne zdanie: nadal ważne, ale nie krzyczy */}
          <h2 className="text-xl md:text-2xl font-semibold text-white/90 leading-snug">
            {t("tagline")}
          </h2>

          {/* dopisek: miękki, spokojny, mniej kontrastu */}
          <p className="text-sm md:text-base text-blue-200/80 leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* CTA: miękko, bez agresji */}
        <button
          onClick={() => router.push("/agent")}
          className="mt-3 px-7 py-3 rounded-xl bg-blue-600/90 text-white text-base hover:bg-blue-500 transition"
        >
          Otwórz NaviMind
        </button>

        {/* mini uspokajacz – opcjonalny, ale robi klimat */}
        <Link href="/plans" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-blue-200 hover:bg-white/10">Wybierz swój pakiet</Link>
        <p className="text-xs text-blue-200/60 max-w-md">
          Pakiety i licencje są w przygotowaniu. Prywatne testy agenta odbywają się w chronionym Workspace.
        </p>
      </div>
    </AppShell>
  );
}