export type FirstState =
  | "anxiety"
  | "chaos"
  | "sadness"
  | "neutral";

export function detectFirstState(text: string): FirstState {
  const t = text.toLowerCase();

  if (/(boję|panik|stres|nie daję rady|mam dość|lęk)/i.test(t)) {
    return "anxiety";
  }

  if (/(nie wiem co robić|pogubi|co wybrać|bez decyzji)/i.test(t)) {
    return "chaos";
  }

  if (/(smutn|pustk|samotn|bez sensu|przygnęb)/i.test(t)) {
    return "sadness";
  }

  return "neutral";
}
