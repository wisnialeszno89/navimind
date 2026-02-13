export type UserState = 0 | 1 | 2 | 3;
/*
0 – normal
1 – stres / smutek
2 – głębokie otwarcie
3 – kryzys
*/

const KEYWORDS = {
  stress: [
    "stres", "zmęczony", "nie ogarniam", "ciężko",
    "martwię", "presja", "problem"
  ],
  deep: [
    "samotny", "boję", "strach", "wstyd",
    "nikomu nie mówię", "nie mam siły",
    "stracę", "odeszła", "rozpad"
  ],
  crisis: [
    "bez sensu żyć",
    "mam dość życia",
    "chcę zniknąć",
    "po co żyć",
    "nie chcę żyć"
  ],
};

export function detectUserState(text: string): UserState {
  const t = text.toLowerCase();

  // 🔴 kryzys
  if (KEYWORDS.crisis.some(k => t.includes(k))) return 3;

  // 🟠 głębokie otwarcie
  if (KEYWORDS.deep.some(k => t.includes(k))) return 2;

  // 🟡 stres
  if (KEYWORDS.stress.some(k => t.includes(k))) return 1;

  // 🟢 normal
  return 0;
}
