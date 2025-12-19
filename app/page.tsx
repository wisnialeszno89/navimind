"use client";

import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";

export default function Page() {
  const router = useRouter();

  return (
    <AppShell>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 24,
        }}
      >
        <h1 style={{ fontSize: 64, fontWeight: 700 }}>
          <span style={{ color: "white" }}>Navi</span>
          <span style={{ color: "#3b82f6" }}>Mind</span>
        </h1>

        <p style={{ fontSize: 22, color: "#93c5fd" }}>
          Rozmowa, która nie udaje.
        </p>

        <button
          onClick={() => router.push("/chat")}
          style={{
            marginTop: 24,
            padding: "14px 28px",
            fontSize: 16,
            borderRadius: 12,
            background: "#3b82f6",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Przejdź do czatu →
        </button>
      </div>
    </AppShell>
  );
}
