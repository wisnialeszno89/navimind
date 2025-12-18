export type UserAnalysis = {
  emotionalTone: "calm" | "anxious" | "frustrated" | "overwhelmed" | "numb";
  clarity: "high" | "medium" | "low";
  avoidance: boolean;
  coreIssue: string; // krótka hipoteza
  recommendedStyle: "direct" | "probing" | "grounding";
};