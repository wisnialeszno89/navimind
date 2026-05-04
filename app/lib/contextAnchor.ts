export function extractContextAnchor(
  history: { role: string; content: string }[]
) {
  const text = history.map(m => m.content).join(" ").toLowerCase();

  if (/żona|była|rozwód/.test(text) && /dziecko|syn/.test(text)) {
    return "Konflikt z byłą partnerką dotyczący dziecka i oskarżeń";
  }

  if (/prawo|sąd|pozew|policja/.test(text)) {
    return "Sytuacja prawna / konflikt prawny";
  }

  if (/kłamstwo|oskarża|stalking/.test(text)) {
    return "Fałszywe oskarżenia i konflikt interpersonalny";
  }

  return "";
}