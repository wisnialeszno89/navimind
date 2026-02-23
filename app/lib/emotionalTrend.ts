import type { CrisisLevel } from "./crisisDetector";

function score(level: CrisisLevel): number {
  if (level === "hard") return 2;
  if (level === "soft") return 1;
  if (level === "none") return 0;
  return 0;
}

export function calculateEmotionalTrend(levels: CrisisLevel[]): number {
  if (!levels.length) return 0;

  const total = levels.reduce((sum, lvl) => sum + score(lvl), 0);
  return total / levels.length;
}