export function predictNext(userText: string, patterns?: string[]): string | null {
  const t = userText.toLowerCase();

  // 🔥 frustracja → eskalacja
  if (/mam dość|wkurwiają|pojebane/.test(t)) {
    return "zaraz możesz chcieć się odciąć albo wybuchnąć";
  }

  // 🔥 pytania egzystencjalne
  if (/czemu|dlaczego/.test(t)) {
    return "będziesz próbował to rozkminić głębiej, ale to może Cię jeszcze bardziej wciągnąć";
  }

  // 🔥 schemat (jeśli mamy historię)
  if (patterns && patterns.length > 0) {
    return "to może znowu pójść w ten sam kierunek, co wcześniej";
  }

  return null;
}