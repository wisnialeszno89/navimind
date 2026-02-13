export type UserAnalysis = {
  // STAN EMOCJONALNY
  emotionalTone?: "calm" | "anxious" | "frustrated" | "overwhelmed" | "numb";
  emotionalCharge?: "low" | "medium" | "high";

  // JAKOŚĆ MYŚLENIA
  clarity?: "low" | "medium" | "high";
  avoidance?: boolean;
  overload?: boolean;

  // STEROWANIE ODPOWIEDZIĄ
  recommendedStyle?: "direct" | "probing" | "grounding";

  // 🔥 INICJATYWA ROZMOWY (NOWE)
  interactionHint?: "ask" | "name" | "narrow";

  // PAMIĘĆ / WZORCE
  coreTheme?: string;
  tension?: string;
  avoidanceReason?: string;
  anchor?: string;
  repetition?: boolean;
};