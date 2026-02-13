export type CrisisLevel = "none" | "low" | "medium" | "high";

/* =========================
   KEYWORDS
   ========================= */

const HIGH_PATTERNS =
  /(chc[eę]\s*(si[eę])?\s*zabi[cć]|zabij[eę]\s*si[eę]|nie\s*chc[eę]\s*ży[cć]|koniec\s*ze\s*mna|suicide|kill\s*myself)/i;

const MEDIUM_PATTERNS =
  /(nie\s*ma\s*sensu|mam\s*dość\s*życia|chc[eę]\s*znikn[aąć]|jest\s*beznadziejnie|everything\s*is\s*pointless)/i;

const LOW_PATTERNS =
  /(jest\s*mi\s*smutno|czuj[eę]\s*si[eę]\s*źle|jestem\s*sam|mam\s*dość|jest\s*ci[eę]żko)/i;

/* =========================
   DETECTOR
   ========================= */

export function detectCrisis(text: string): CrisisLevel {
  if (!text) return "none";

  if (HIGH_PATTERNS.test(text)) return "high";
  if (MEDIUM_PATTERNS.test(text)) return "medium";
  if (LOW_PATTERNS.test(text)) return "low";

  return "none";
}
