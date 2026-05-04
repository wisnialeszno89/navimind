export function injectSolutions(userText: string, text: string): string {
  const t = userText.toLowerCase();

  // 🔥 PODRÓŻ / WYJAZD
  if (/gdzie|wyjazd|majówk|kamper|natura/.test(t)) {
    return text + "\n\nMożesz pójść w jedną z trzech opcji: dziko i cisza, balans natura+miasto albo totalny reset – powiedz tylko który klimat chcesz, zawężę to konkretnie.";
  }

  // 🔥 PROBLEMY ŻYCIOWE / OGÓLNE
  if (/problem|nie wiem|co robić|jak/.test(t)) {
    return text + "\n\nZróbmy to prosto: albo rozwiązujesz to od strony działania, albo od strony głowy – powiedz co chcesz ruszyć najpierw.";
  }

  // 🔥 ZWIĄZKI / EMOCJE
  if (/była|związek|rozstanie|żona|partner/.test(t)) {
    return text + "\n\nTu masz dwie drogi: albo zamykasz temat i odcinasz się mentalnie, albo próbujesz to jeszcze poukładać – tylko nie da się stać w połowie.";
  }

  // 🔥 ZDROWIE / PSYCHOLOG
  if (/psycholog|depresja|dzieci|terapia/.test(t)) {
    return text + "\n\nRealnie masz trzy opcje: online (najszybciej), prywatnie poza dużymi miastami albo fundacje – każda działa inaczej, mogę to rozbić pod Ciebie.";
  }

  // 🔥 FINANSE / PRACA
  if (/praca|pieniądze|zarabiać|biznes/.test(t)) {
    return text + "\n\nTu zawsze są trzy ścieżki: zwiększyć dochód, uciąć koszty albo zmienić kierunek – pytanie gdzie masz największy potencjał.";
  }

  // 🔥 DEFAULT (NAJWAŻNIEJSZE)
  return text + "\n\nMożemy to rozbić na konkretne opcje i wybrać najlepszą pod Ciebie.";
  
  if (text.length > 220) return text;
}
