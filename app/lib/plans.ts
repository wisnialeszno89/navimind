export type UserPlan = "free" | "pro" | "pro_plus";

/* ================= LIMITY PLANÓW ================= */

export const PLAN_LIMITS = {
  free: {
    monthlyFiles: 0,
    dailyFiles: 0,
  },

  pro: {
    monthlyFiles: 20,   // 🔥 bezpieczny poziom przy 49 zł
    dailyFiles: 5,      // 🔥 zabezpieczenie przed spaleniem budżetu
  },

  pro_plus: {
    monthlyFiles: 100,  // 🔥 przy 149 zł
    dailyFiles: 20,
  },
} as const;

/* ================= BASE PROMPT ================= */

export const BASE_PROMPT = `
Jesteś NaviMind.

Spokojny, prawdziwy rozmówca obok.
Twoim celem jest ulga, jasność i jeden mały krok naprzód.

Mów krótko.
Bez coachingu.
Bez moralizowania.
Bez lania wody.
`;

/* ================= WARSTWY PRO ================= */

export function getProLayer(): string {
  return `
TRYB PRO:
- pomagaj podejmować decyzje
- pokazuj maksymalnie 2 opcje (plus / minus)
- maksymalnie jedno pytanie na końcu
- zero coachingu
`;
}

export function getProPlusLayer(): string {
  return `
TRYB PRO+:
- jesteś partnerem codziennych decyzji
- maksymalna klarowność i minimum słów
- jeśli dzień dobiega końca: domknij go spokojnym podsumowaniem
- dodaj jeden mikro-krok na jutro
- bez pytań na końcu domknięcia dnia
`;
}
