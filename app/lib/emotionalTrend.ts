import { CrisisLevel } from "./crisisDetector";

const MAX_HISTORY = 20;

/* =========================
   SCORE
   ========================= */

function score(level: CrisisLevel): number {
  if (level === "high") return 2;
  if (level === "medium") return 1;
  if (level === "low") return 0;
  return -1;
}

/* =========================
   TREND CALC
   ========================= */

export function calculateTrend(levels: CrisisLevel[]): number {
  return levels.slice(-MAX_HISTORY).reduce((sum, l) => sum + score(l), 0);
}

/* =========================
   STATE
   ========================= */

export type TrendState = "stable" | "worsening" | "critical";

export function getTrendState(levels: CrisisLevel[]): TrendState {
  const trend = calculateTrend(levels);

  if (trend >= 6) return "critical";
  if (trend >= 3) return "worsening";
  return "stable";
}