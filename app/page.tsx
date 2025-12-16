"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [stars, setStars] = useState<string>("");

  useEffect(() => {
    const s = Array.from({ length: 160 })
      .map(
        () =>
          `${Math.random() * 3000}px ${Math.random() * 3000}px rgba(255,255,255,0.9)`
      )
      .join(",");
    setStars(s);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#020617] overflow-hidden">
      {/* TŁO */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: stars,
        }}
      />

      {/* KARTA A4 */}
      <div className="relative z-10 w-full max-w-[720px] mx-6 rounded-2xl bg-[#020617]/85 backdrop-blur border border-white/10 px-10 py-14 text-center shadow-2xl">
        <h1 className="text-5xl md:text-6xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-blue-500">
          NaviMind
        </h1>

        <p className="mt-6 text-blue-100/80">
          Rozmowa, która pozwala się zatrzymać.
        </p>

        <button
          onClick={() => router.push("/chat")}
          className="mt-10 px-12 py-4 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-sky-400 shadow-lg hover:from-blue-400 hover:to-sky-300"
        >
          Przejdź do czatu →
        </button>

        <div className="mt-12 text-xs text-blue-200/40">
          © 2026 NaviMind
        </div>
      </div>
    </div>
  );
}