import { kv } from "@vercel/kv";
import { UserAnalysis } from "./analysis";
import { PseudoMemory } from "./pseudoMemory";

const TTL_30_DAYS = 60 * 60 * 24 * 30;

export async function updatePseudoMemory(
  userId: string,
  analysis: UserAnalysis
) {
  const key = `memory:${userId}`;
  const now = Date.now();

  const existing =
    (await kv.get<PseudoMemory>(key)) ?? {
      visits: 0,
      dominantEmotions: {},
      recurringIssues: {},
      avoidanceCount: 0,
      preferredStyle: analysis.recommendedStyle,
      lastSeen: now,
    };

  const updated: PseudoMemory = {
    visits: existing.visits + 1,

    dominantEmotions: {
      ...existing.dominantEmotions,
      [analysis.emotionalTone]:
        (existing.dominantEmotions[analysis.emotionalTone] ?? 0) + 1,
    },

    recurringIssues: {
      ...existing.recurringIssues,
      [analysis.coreIssue]:
        (existing.recurringIssues[analysis.coreIssue] ?? 0) + 1,
    },

    avoidanceCount:
      existing.avoidanceCount + (analysis.avoidance ? 1 : 0),

    preferredStyle: analysis.recommendedStyle,
    lastSeen: now,
  };

  await kv.set(key, updated, { ex: TTL_30_DAYS });

  return updated;
}
