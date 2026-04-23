import { kv } from "@vercel/kv";
import { UserAnalysis } from "./analysis";
import { PseudoMemory } from "./pseudoMemory";

const TTL_30_DAYS = 60 * 60 * 24 * 30;

/* ===== HELPERS ===== */

function increment(
  obj: Record<string, number> | undefined,
  key?: string
) {
  const safeObj = obj ?? {};
  if (!key) return safeObj;

  return {
    ...safeObj,
    [key]: (safeObj[key] ?? 0) + 1,
  };
}

/* ===== MAIN FUNCTION ===== */

export async function updatePseudoMemory(
  userId: string,
  analysis: UserAnalysis,
  styleUpdate?: {
    short?: number;
    long?: number;
    chaotic?: number;
    direct?: number;
  }
) {
  const key = `memory:${userId}`;
  const now = Date.now();

  const raw = await kv.get<PseudoMemory>(key);

  const existing: PseudoMemory = {
    visits: raw?.visits ?? 0,
    lastSeen: raw?.lastSeen ?? now,

    coreThemes: raw?.coreThemes ?? {},
    tensions: raw?.tensions ?? {},
    avoidances: raw?.avoidances ?? {},
    anchors: raw?.anchors ?? [],

    style: raw?.style ?? {
      short: 0,
      long: 0,
      chaotic: 0,
      direct: 0,
    },
  };

  const updated: PseudoMemory = {
    visits: existing.visits + 1,
    lastSeen: now,

    coreThemes: increment(
      existing.coreThemes,
      analysis.coreTheme
    ),

    tensions: increment(
      existing.tensions,
      analysis.tension
    ),

    avoidances: analysis.avoidance
      ? increment(
          existing.avoidances,
          analysis.avoidanceReason
        )
      : existing.avoidances,

    anchors:
      analysis.anchor &&
      !existing.anchors.includes(analysis.anchor)
        ? [...existing.anchors.slice(-4), analysis.anchor]
        : existing.anchors,

    style: {
      short: existing.style.short + (styleUpdate?.short || 0),
      long: existing.style.long + (styleUpdate?.long || 0),
      chaotic: existing.style.chaotic + (styleUpdate?.chaotic || 0),
      direct: existing.style.direct + (styleUpdate?.direct || 0),
    },
  };

  await kv.set(key, updated, { ex: TTL_30_DAYS });

  return updated;
}