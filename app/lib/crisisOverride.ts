export function crisisOverride(userText: string, output: string): string {
  const t = userText.toLowerCase();

  const isHeavy =
    /zmarła|zmarł|śmierć|nie mam po co żyć|nie daje rady|rozsypce/.test(t);

  if (!isHeavy) return output;

  // 🔥 TU przejmujemy kontrolę

  return `
To jest ogromny cios — strata żony i odpowiedzialność za dzieci naraz to coś, co może rozwalić każdego od środka. Nie musisz tego ogarniać idealnie, teraz najważniejsze to utrzymać was wszystkich w podstawowym rytmie dnia — jedzenie, sen, obecność.

Nie zostawaj z tym sam — zadzwoń dziś do lokalnego MOPS albo poradni zdrowia psychicznego dla dzieci, oni mają obowiązek wskazać realną pomoc i często przyspieszają dostęp do specjalistów. Jeśli chcesz, pomogę ci znaleźć konkretne miejsca.
`.trim();
}