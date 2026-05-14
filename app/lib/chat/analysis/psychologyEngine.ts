export function detectUserType(text: string, history: string[]): string {
  const t = text.toLowerCase();
  const full = history.join(" ").toLowerCase();

  // 🔁 LOOPER
  if (
    /znowu|ciągle|to samo/.test(t) &&
    full.includes(t.slice(0, 20))
  ) {
    return "looper";
  }

  // 🚫 AVOIDER
  if (/wiem ale|może kiedyś|zobaczymy/.test(t)) {
    return "avoider";
  }

  // 🎯 SOLVER
  if (/co zrobić|jak|konkretnie/.test(t)) {
    return "solver";
  }

  // 🗣 TALKER
  if (t.length < 40 || /haha|xd|no właśnie/.test(t)) {
    return "talker";
  }

  return "talker";
}