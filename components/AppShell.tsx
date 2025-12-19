"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

const MAX_MESSAGES = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function AppShell({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number>(0);
  const [resetIn, setResetIn] = useState<string>("");

  useEffect(() => {
    function update() {
      const storedCount = Number(
        localStorage.getItem("navimind_message_count") || 0
      );
      const ts = Number(
        localStorage.getItem("navimind_first_message_ts") || 0
      );

      setCount(storedCount);

      if (!ts) {
        setResetIn("24h");
        return;
      }

      const diff = Date.now() - ts;
      const left = DAY_MS - diff;

      if (left <= 0) {
        setResetIn("teraz");
        return;
      }

      const h = Math.floor(left / (1000 * 60 * 60));
      const m = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
      setResetIn(`${h}h ${m}m`);
    }

    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          height: "85vh",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            padding: "8px 14px",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#93c5fd",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            Demo · {count}/{MAX_MESSAGES} wiadomości
            {count >= MAX_MESSAGES && (
              <span style={{ marginLeft: 8, color: "#fca5a5" }}>
                (reset za {resetIn})
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/regulamin">Regulamin</Link>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}