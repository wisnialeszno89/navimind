export type UserAnalysis = {
  // ISTNIEJĄCE POLA – ZOSTAWIASZ
  emotionalTone?: string;
  avoidance?: boolean;
  clarity?: "low" | "medium" | "high";
  recommendedStyle?: string;
  overload?: boolean;
  emotionalCharge?: "low" | "medium" | "high";

  // 🔥 NOWE POLA POD MEMORY v2
  coreTheme?: string;
  tension?: string;
  avoidanceReason?: string;
  anchor?: string;
};