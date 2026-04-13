"use client";

import { useEffect, useState } from "react";

export default function PlanGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pro")
      .then((res) => res.json())
      .then((data) => {
        setPlan(data.plan);
      })
      .catch(() => {
        setPlan("free");
      });
  }, []);

  if (plan === null) {
    return null; // możesz dać loader później
  }

  // 👉 jeśli user ma PRO+ → nic nie pokazujemy
  if (plan === "pro_plus") {
    return (
      <div className="text-white/60 text-sm">
        Masz aktywny plan PRO+ 🚀
      </div>
    );
  }

  // 👉 jeśli PRO → pokaż tylko upgrade
  if (plan === "pro") {
    return (
      <div className="space-y-4">
        <div className="text-white/60 text-sm">
          Masz aktywny plan PRO
        </div>

        {children /* pokaż tylko PRO+ kartę */}
      </div>
    );
  }

  // 👉 FREE → pokaż wszystko
  return <>{children}</>;
}