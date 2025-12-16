"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* TŁO GWIAZD */}
      <div className="absolute inset-0 stars" />

      {/* KARTA CENTRALNA */}
      <div className="relative z-10 w-full max-w-[720px] mx-4
                      rounded-3xl bg-black/50 backdrop-blur-xl
                      border border-white/10
                      px-10 py-16 text-center shadow-2xl">

        <h1 className="text-6xl font-semibold tracking-tight">
          <span className="text-white">Navi</span>
          <span className="text-blue-500">Mind</span>
        </h1>

        <p className="mt-6 text-xl text-blue-200/90">
          Spokojna rozmowa. Bez pośpiechu. Bez masek.
        </p>

        <button
          onClick={() => router.push("/chat")}
          className="mt-12 w-full rounded-2xl
                     bg-blue-500 hover:bg-blue-400
                     px-10 py-6 text-2xl font-medium text-white
                     transition shadow-xl shadow-blue-500/40"
        >
          Wejdź do czatu →
        </button>

        <div className="mt-14 text-sm text-blue-200/40">
          © 2026 NaviMind
        </div>
      </div>
    </div>
  );
}