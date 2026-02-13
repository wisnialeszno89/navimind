"use client";

import { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-dvh bg-[#020617] flex justify-center">
      {/* desktop center */}
      <div className="w-full md:max-w-[900px] min-h-dvh flex flex-col bg-[#020617]">
        {children}
      </div>
    </div>
  );
}
