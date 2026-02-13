"use client";

import { useEffect, useState } from "react";

type Level = "none" | "low" | "medium" | "high";

type Props = {
  levels: Level[];
};

function score(l: Level) {
  if (l === "high") return 3;
  if (l === "medium") return 2;
  if (l === "low") return 1;
  return 0;
}

export default function MoodChart({ levels }: Props) {
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    setPoints(levels.map(score));
  }, [levels]);

  if (!levels.length) return null;

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-white/70 mb-3">
        Twój nastrój w ostatnich rozmowach
      </div>

      <div className="flex items-end gap-1 h-24">
        {points.map((p, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${(p / 3) * 100}%`,
              background:
                p === 3
                  ? "#ef4444"
                  : p === 2
                  ? "#f59e0b"
                  : p === 1
                  ? "#3b82f6"
                  : "#334155",
            }}
          />
        ))}
      </div>

      <div className="mt-3 text-xs text-white/50">
        Czerwony = silny kryzys • Pomarańczowy = pogorszenie •
        Niebieski = napięcie • Szary = stabilnie
      </div>
    </div>
  );
}
