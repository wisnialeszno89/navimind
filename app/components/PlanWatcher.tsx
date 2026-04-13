"use client";

import { useEffect } from "react";

export default function PlanWatcher() {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/pro");
        const data = await res.json();

        if (data.plan && data.plan !== "free") {
          console.log("🔥 PLAN AKTYWOWANY:", data.plan);
          // window.location.reload();
        }
      } catch (e) {
        console.log("PLAN CHECK ERROR");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return null;
}