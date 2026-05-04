export function actionOverride(userText: string, output: string): string {
  const t = userText.toLowerCase();

  const needsHelp =
    /co robic|co zrobić|polecic|pomoc|wsparcie|nie radze sobie|nie daje rady/.test(t);

  if (!needsHelp) return output;

  const isHeavy =
    /zmarła|zmarł|śmierć|dzieci|kryzys/.test(t);

  if (!isHeavy) return output;

  // 🔥 przejmujemy ster

  return `
To jest sytuacja, w której sam nie jesteś w stanie tego udźwignąć i to nie jest kwestia „ogarnięcia się”, tylko realnego wsparcia dla ciebie i dzieci.

Zrób teraz konkretnie: skontaktuj się z najbliższą poradnią zdrowia psychicznego dla dzieci (na NFZ – bez skierowania), a równolegle zadzwoń do MOPS i poproś o wsparcie rodzinne lub asystenta rodziny — oni mają obowiązek to uruchomić i często przyspieszają dostęp do psychologa. Jeśli chcesz, znajdę Ci konkretne miejsca u Ciebie i numery telefonu.
`.trim();
}