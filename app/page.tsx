"use client";

import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";

export default function Home() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex flex-col items-center text-center">
        <h1 className="text-6xl font-bold">
          <span className="text-white">Navi</span>
          <span className="text-blue-500">Mind</span>
        </h1>

        <p className="mt-6 text-xl text-blue-300">
          Rozmowa, która nie udaje.
        </p>

        <button
          onClick={() => router.push("/chat")}
          className="mt-12 rounded-xl bg-blue-500 px-6 py-3 text-white font-medium hover:bg-blue-600 transition"
        >
          Wejdź do czatu →
        </button>
      </div>
    </AppShell>
  );
}