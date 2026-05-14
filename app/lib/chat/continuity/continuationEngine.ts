export function addContinuation(text: string, userText: string): string {
  const t = userText.toLowerCase();

  if (/pomysł|przykłady|gdzie/.test(t)) {
    return text + "\n\nJak chcesz, mogę zawęzić to do jednego konkretnego miejsca pod Twój styl.";
  }

  if (/nie radze|ciężko|kryzys/.test(t)) {
    return text + "\n\nJesteś w tym teraz i nie zostawiam cię z tym.";
  }

  return text;
}