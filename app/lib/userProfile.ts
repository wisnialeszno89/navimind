export type UserProfile = {
  archetype: "fighter" | "lost" | "thinker" | "avoider";
  communication: "direct" | "soft" | "analytical";
  trustLevel: number;
  decisionStyle: "fast" | "blocked" | "overthinking";
  mainNeed: string;
  flowStage?: "support" | "direction" | "action";

  decisions?: {
    text: string;
    createdAt: number;
    done?: boolean;
  }[];
};

const store = new Map<string, UserProfile>();

export function getUserProfile(userId: string): UserProfile {
  if (!store.has(userId)) {
    store.set(userId, {
      archetype: "lost",
      communication: "direct",
      trustLevel: 10,
      decisionStyle: "blocked",
      mainNeed: "clarity",
      flowStage: "support",
      decisions: [],
    });
  }
  return store.get(userId)!;
}

export function updateUserProfile(userId: string, analysis: any) {
  const profile = getUserProfile(userId);

  if (analysis.loop === "ruminacje") {
    profile.decisionStyle = "overthinking";
  }

  if (analysis.state === "kryzys") {
    profile.communication = "soft";
  } else {
    profile.communication = "direct";
  }

  if (analysis.need === "kierunek") {
    profile.mainNeed = "direction";
  }

  // 🔥 FLOW STAGE
  if (analysis.mode === "direction") profile.flowStage = "direction";
  if (analysis.mode === "action") profile.flowStage = "action";

  profile.trustLevel = Math.min(profile.trustLevel + 2, 100);

  store.set(userId, profile);
}

// 🔥 NOWE – SAVE DECISION
export function saveDecision(userId: string, text: string) {
  const profile = getUserProfile(userId);

  if (!profile.decisions) profile.decisions = [];

  profile.decisions.push({
    text,
    createdAt: Date.now(),
    done: false,
  });

  store.set(userId, profile);
}