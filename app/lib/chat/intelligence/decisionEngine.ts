export function generateOptions(context: string): string[] {
  const t = context.toLowerCase();

  // 🔥 praca
  if (/praca|zarob|firma/.test(t)) {
    return [
      "1. Zmień pracę na lepiej płatną",
      "2. Zostań i negocjuj warunki",
      "3. Dorób coś obok",
    ];
  }

  // 🔥 związek
  if (/związek|żona|partner|rozstanie/.test(t)) {
    return [
      "1. Spróbuj to naprawić",
      "2. Zrób dystans i ochłoń",
      "3. Zamknij temat i idź dalej",
    ];
  }

  // 🔥 zdrowie / forma
  if (/ciało|siłownia|waga|forma/.test(t)) {
    return [
      "1. Zacznij trening 3x w tygodniu",
      "2. Popraw dietę",
      "3. Zrób badania i sprawdź hormony",
    ];
  }

  // 🔥 default
  return [
    "1. Zrób pierwszy mały krok",
    "2. Sprawdź opcje i wybierz jedną",
    "3. Daj sobie dzień na decyzję",
  ];
}export function detectDecisionMoment(text: string): boolean {
  const t = text.toLowerCase();

  return /co zrobić|co robic|mam dość|nie wiem co dalej|jak to ogarnąć/.test(t);
}export function getDecisionNudge(text: string): string | null {
  const t = text.toLowerCase();

  if (/ludzie|toksyczni/.test(t)) {
    return "odetnij się dziś od jednej osoby lub sytuacji, która Cię męczy";
  }

  if (/praca|szef/.test(t)) {
    return "zrób jedną małą rzecz, która odzyska dla Ciebie kontrolę";
  }

  if (/mam dość|zmęczony/.test(t)) {
    return "zatrzymaj się na chwilę i nic nie rób przez 10 minut";
  }

  return null;
}