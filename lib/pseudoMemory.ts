export type PseudoMemory = {
  visits: number;

  dominantEmotions: Record<string, number>; // np. anxious: 4
  recurringIssues: Record<string, number>;  // np. "fear of decision": 3

  avoidanceCount: number;

  preferredStyle: "direct" | "probing" | "grounding";
  lastSeen: number;
};