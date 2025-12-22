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
    <div className="h-screen w-full bg-[#020617] flex justify-center items-stretch p-4 overflow-hidden">
      <div className="w-full max-w-[900px] flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-0">
        {/* TOP BAR */}
        <div className="shrink-0 px-4 py-2 text-sm flex justify-between items-center text-blue-300 border-b border-white/10">
          <div>
            Demo · {count}/{MAX_MESSAGES} wiadomości
            {count >= MAX_MESSAGES && (
              <span className="ml-2 text-red-300">
                (reset za {resetIn})
              </span>
            )}
          </div>

          <div className="flex gap-3 text-blue-200">
            <Link href="/regulamin">Regulamin</Link>
          </div>
        </div>

        {/* CONTENT (CHAT) */}
        <div className="flex-1 min-h-0 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}