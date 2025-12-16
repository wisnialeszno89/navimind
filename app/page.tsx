"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#020617] overflow-hidden">
      {/* GWIAZDY */}
      <div className="absolute inset-0 stars" />

      {/* KARTA */}
      <div className="relative z-10 w-full max-w-[720px] mx-auto rounded-2xl
                      bg-black/40 backdrop-blur-xl
                      border border-white/10
                      px-10 py-14 text-center shadow-2xl">

        {/* LOGO */}
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
          <span className="text-white">Navi</span>
          <span className="text-blue-400">Mind</span>
        </h1>

        {/* OPIS */}
        <p className="mt-6 text-lg text-blue-200/80">
          Rozmowa, która pozwala się zatrzymać.
        </p>

        {/* CTA */}
        <button
          onClick={() => router.push("/chat")}
          className="mt-10 w-full rounded-xl
                     bg-gradient-to-r from-blue-500 to-blue-400
                     px-10 py-5 text-xl font-medium text-white
                     hover:from-blue-400 hover:to-blue-300
                     transition shadow-lg shadow-blue-500/40"
        >
          Przejdź do czatu →
        </button>

        <div className="mt-12 text-sm text-blue-200/40">
          © 2026 NaviMind
        </div>
      </div>
    </div>
  );
}