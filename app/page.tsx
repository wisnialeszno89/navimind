"use client";

import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-6xl font-bold tracking-tight">
          <span className="text-white">Navi</span>
          <span className="text-blue-500">Mind</span>
        </h1>

        <p className="mt-6 text-xl text-blue-200">
          Rozmowa, która nie udaje.
        </p>

        <p className="mt-2 text-sm text-white/50">
          Bez coachingu. Bez terapii. Bez masek.
        </p>

        <div className="mt-10">
          <button
            onClick={() => router.push("/chat")}
            className="
              rounded-xl
              bg-blue-500
              px-8 py-3
              text-white
              font-medium
              hover:bg-blue-400
              transition
            "
          >
            Wejdź do rozmowy →
          </button>
        </div>

        <p className="mt-8 text-xs text-white/40">
          NaviMind to narzędzie refleksji, nie terapia.
        </p>
      </div>
    </div>
  );
}