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
}