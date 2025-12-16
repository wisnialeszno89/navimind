"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#020617] overflow-hidden">
      {/* TŁO – GWIAZDY */}
      <div className="absolute inset-0 stars" />

      {/* KARTA */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
          <span className="text-white">Navi</span>
          <span className="text-blue-400">Mind</span>
        </h1>

        <p className="mt-6 text-lg text-blue-200/80 max-w-xl mx-auto">
          Rozmowa, która pozwala się zatrzymać.
        </p>

        <button
          onClick={() => router.push("/chat")}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-lg font-medium text-white
                     hover:bg-blue-400 transition shadow-lg shadow-blue-500/30"
        >
          Przejdź do czatu →
        </button>

        <div className="mt-16 text-sm text-blue-200/40">
          © 2026 NaviMind
        </div>
      </div>
    </div>
  );
}