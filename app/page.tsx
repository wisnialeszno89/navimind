"use client";

import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold">
          <span className="text-white">Navi</span>
          <span className="text-blue-400">Mind</span>
        </h1>

        <p className="mt-6 text-xl text-blue-200">
          Rozmowa, która nie udaje.
        </p>

        <button
          onClick={() => router.push("/chat")}
          className="mt-10 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition"
        >
          Wejdź do rozmowy →
        </button>

        <p className="mt-8 text-sm text-white/50">
          NaviMind to narzędzie refleksji, nie terapia.
        </p>
      </div>
    </div>
  );
}