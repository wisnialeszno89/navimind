"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="w-full max-w-[900px] h-[80vh]
                     flex flex-col items-center justify-center
                     text-center gap-8 stars">

      <h1 className="text-6xl font-bold tracking-tight">
        <span className="text-white">Navi</span>
        <span className="text-blue-500">Mind</span>
      </h1>

      <p className="text-xl text-blue-200/80 max-w-xl">
        Spokojna rozmowa. Bez pośpiechu. Bez masek.
      </p>

      <button
        onClick={() => router.push("/chat")}
        className="mt-6 px-10 py-4 text-lg font-medium
                   bg-blue-600 hover:bg-blue-500 transition
                   rounded-full shadow-lg"
      >
        Wejdź do czatu →
      </button>

      <div className="mt-10 text-sm text-white/40">
        © 2026 NaviMind
      </div>
    </main>
  );
}