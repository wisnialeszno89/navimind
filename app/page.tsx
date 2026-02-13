"use client";

import { useRouter } from "next/navigation";
import AppShell from "./components/AppShell";
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
          onClick={() => router.push("/chat")}
          className="mt-3 px-7 py-3 rounded-xl bg-blue-600/90 text-white text-base hover:bg-blue-500 transition"
        >
          {t("startChat")}
        </button>

        {/* mini uspokajacz – opcjonalny, ale robi klimat */}
        <p className="text-xs text-blue-200/60 max-w-md">
          Bez ocen. Bez presji. Możesz zacząć od jednego zdania.
        </p>
      </div>
    </AppShell>
  );
}