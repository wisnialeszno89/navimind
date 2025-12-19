"use client";

import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";;

export default function Home() {
  const router = useRouter();

  return (
    <AppShell>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 64, fontWeight: 700 }}>
          <span style={{ color: "white" }}>Navi</span>
          <span style={{ color: "#3b82f6" }}>Mind</span>
        </h1>

        <p style={{
          marginTop: 24,
          fontSize: 22,
          color: "#93c5fd",
        }}>
          Rozmowa, która nie udaje.
        </p>

        <div style={{ marginTop: 48 }}>
          <button
            onClick={() => router.push("/chat")}
            className="button-primary"
          >
            Wejdź do czatu →
          </button>
        </div>
      </div>
    </AppShell>
  );
}

