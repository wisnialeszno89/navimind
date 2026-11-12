/**
 * Display-only commercial catalogue (draft, 2026-11-12).
 * This file is intentionally NOT connected to legacy pro/pro_plus entitlements,
 * billing, agent execution, usage limits or payment providers.
 */
export const commercialPlans = [
  {
    id: "personal-starter",
    category: "personal",
    name: "Personal Starter",
    pricePln: 49,
    priceTax: "brutto",
    seats: "1 komputer",
    aiBudgetPln: 5,
    highlighted: false,
    description: "Codzienne, proste zadania bez żmudnego klikania.",
    features: [
      "Automatyzacja prostych czynności na komputerze",
      "Obsługa plików i podstawowych aplikacji",
      "Miesięczny budżet AI: 5 zł",
      "Możliwość dokupienia środków AI w przyszłości",
    ],
  },
  {
    id: "personal-pro",
    category: "personal",
    name: "Personal Pro",
    pricePln: 119,
    priceTax: "brutto",
    seats: "do 2 komputerów",
    aiBudgetPln: 18,
    highlighted: true,
    description: "Więcej automatyzacji i dłuższe zadania.",
    features: [
      "Wszystko z Personal Starter",
      "Wielokrokowe zadania i zapisane procedury",
      "Miesięczny budżet AI: 18 zł",
      "Planowana obsługa własnego klucza API (BYOK)",
    ],
  },
  {
    id: "business",
    category: "business",
    name: "Business",
    pricePln: 399,
    priceTax: "netto",
    seats: "1 stanowisko",
    aiBudgetPln: 70,
    highlighted: true,
    description: "Cyfrowy asystent do powtarzalnych procesów biurowych.",
    features: [
      "Automatyzacje dokumentów i aplikacji firmowych",
      "Zapisane procedury i historia zadań",
      "Miesięczny budżet AI: 70 zł",
      "Wdrożenie i konfiguracja wyceniane osobno",
    ],
  },
  {
    id: "business-custom",
    category: "business",
    name: "Business Custom",
    pricePln: 999,
    priceTax: "netto",
    seats: "stanowiska według umowy",
    aiBudgetPln: 180,
    highlighted: false,
    description: "Procesy dopasowane do konkretnej firmy.",
    features: [
      "Indywidualne scenariusze i integracje",
      "Miesięczny budżet AI: 180 zł",
      "Priorytet wdrożeniowy zależnie od umowy",
      "Indywidualna wycena dodatkowych stanowisk i SLA",
    ],
  },
] as const;

export type CommercialPlanId = (typeof commercialPlans)[number]["id"];
export function getCommercialPlan(id: string | undefined) {
  return commercialPlans.find((plan) => plan.id === id);
}
