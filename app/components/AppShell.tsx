"use client";

import { ReactNode } from "react";
import Link from "next/link";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-dvh bg-[#020617] flex justify-center">
      {/* desktop center */}
      <div className="w-full md:max-w-[900px] min-h-dvh flex flex-col bg-[#020617]">
        {children}
      </div>

      {/* subtle legal links */}
      <div className="fixed bottom-3 right-4 text-[10px] text-white/30 select-none">
        <Link
          href="/regulamin"
          className="hover:text-white/60 transition"
        >
          regulamin
        </Link>
        <span className="mx-1">•</span>
        <Link
          href="/prywatnosc"
          className="hover:text-white/60 transition"
        >
          prywatność
        </Link>
      </div>
    </div>
  );
}