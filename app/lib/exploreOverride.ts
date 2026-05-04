export function exploreOverride(userText: string, base: string): string {
  const t = userText.toLowerCase();

  if (/kamper|dziko|natura/.test(t)) {
    return `Masz 3 bardzo dobre opcje pod Twój klimat:

1. Łagów + Jezioro Niesłysz → masz wodę, las i miasteczko w zasięgu 10–15 min
2. Dolina Baryczy → spokojniej, dużo tras rowerowych i zero tłumów
3. Puszcza Zielonka pod Poznaniem → dziko, ale blisko miasta

Najprościej z Leszna:
→ Łagów: S5 → A2 → zjazd Świebodzin → 1h 40min
→ Barycz: przez Rawicz → 1h
→ Zielonka: S5 → Poznań → 1h 30min

Jak chcesz ciszę totalną → Barycz
Jak balans → Łagów`;
  }

  return base;
}