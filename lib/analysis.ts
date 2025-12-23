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

  // PAMIĘĆ / WZORCE
  coreTheme?: string;        // o czym to jest (1–3 słowa)
  tension?: string;          // gdzie się zacina
  avoidanceReason?: string;  // co jest omijane
  anchor?: string;           // zdanie warte zapamiętania
  repetition?: boolean;      // 🔥 CZY TO WRACA (PĘTLA)
};