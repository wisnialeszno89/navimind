import { kv } from "@vercel/kv";
import { UserAnalysis } from "./analysis";
import { PseudoMemory } from "./pseudoMemory";

const TTL_30_DAYS = 60 * 60 * 24 * 30;

function increment(
  obj: Record<string, number>,
  key?: string
) {
  if (!key) return obj;
  return {
    ...obj,
    [key]: (obj[key] ?? 0) + 1,
  };
}

export async function updatePseudoMemory(
  userId: string,
  analysis: UserAnalysis
) {
  const key = `memory:${userId}`;
  const now = Date.now();

  const existing =
    (await kv.get<PseudoMemory>(key)) ?? {
      visits: 0,
      lastSeen: now,
      coreThemes: {},
      tensions: {},
      avoidances: {},
      anchors: [],
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
      ? increment(existing.avoidances, analysis.avoidanceReason)
      : existing.avoidances,

    anchors:
      analysis.anchor &&
      !existing.anchors.includes(analysis.anchor)
        ? [...existing.anchors.slice(-4), analysis.anchor]
        : existing.anchors,
  };

  await kv.set(key, updated, { ex: TTL_30_DAYS });
  return updated;
}