export type CrisisLevel = "none" | "soft" | "hard";

export function detectCrisis(text: string): CrisisLevel {
  const lower = text.toLowerCase();

  // 🔴 HARD – bezpośrednie zagrożenie
  const hard =
    /(zabij(e|ę) się|chc(e|ę) się zabić|zaraz coś sobie zrobię|mam plan|kończę ze sobą)/i.test(
      lower
    );

  if (hard) return "hard";

  // 🟡 SOFT – utrata sensu / rezygnacja
  const soft =
    /(nie chce mi się żyć|nie chce mi sie zyc|nie widze sensu|mam dosc zycia|chce zniknac)/i.test(
      lower
    );

  if (soft) return "soft";

  return "none";
}