"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="center-screen stars">
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "64px", fontWeight: 700 }}>
          <span style={{ color: "white" }}>Navi</span>
          <span style={{ color: "var(--blue-main)" }}>Mind</span>
        </h1>

        <p style={{
          marginTop: 24,
          fontSize: 22,
          color: "var(--blue-soft)"
        }}>
          Spokojna rozmowa. Bez pośpiechu. Bez masek.
        </p>

        <div style={{ marginTop: 48 }}>
          <button
            className="button-primary"
            onClick={() => router.push("/chat")}
          >
            Wejdź do czatu →
          </button>
        </div>

        <div style={{
          marginTop: 64,
          fontSize: 14,
          opacity: .4
        }}>
          © 2026 NaviMind
        </div>
      </div>
    </main>
  );
}