export type Analysis = {
  problem: string;
  state: string;
  loop: string;
  need: string;
  priority: string;
  mode: "support" | "direction" | "explain" | "action";
  intent: "discovery" | "action" | "emotional" | "explain" | "general";
};

export function analyzeUserMessage(text: string): Analysis {
  const t = text.toLowerCase();

  /* ========= INTENT (KLUCZ) ========= */

  let intent: Analysis["intent"] = "general";

  if (/gdzie|co zobaczyć|co fajnego|zwiedzić|poleć|weekend|wyjazd|atrakcje/.test(t)) {
    intent = "discovery";
  } else if (/jak|co zrobić|krok po kroku|jak zacząć/.test(t)) {
    intent = "action";
  } else if (/dlaczego|czemu/.test(t)) {
    intent = "explain";
  } else if (/czuję|mam dość|nie daje rady|pustka|bez sensu/.test(t)) {
    intent = "emotional";
  }

  /* ========= PROBLEM ========= */

  let problem = "brak jasności";

  if (/żona|zdrad|rozstanie/.test(t)) problem = "rozpad związku";
  if (/dzieci/.test(t)) problem = "utrata kontaktu z dziećmi";
  if (/nie chce mi się|nic mnie nie cieszy/.test(t)) problem = "utrata energii / sensu";
  if (/ciało|wygląd|boczki|klatka/.test(t)) problem = "problemy z ciałem";

  if (intent === "discovery") {
    problem = "szukanie kierunku / doświadczeń";
  }

  /* ========= STAN ========= */

  let state = "neutral";

  if (/nie chce mi się żyć|bez sensu/.test(t)) state = "kryzys";
  else if (/przytłacza|nie daje rady|pustka/.test(t)) state = "przeciążenie";

  /* ========= PĘTLA ========= */

  let loop = "brak";

  if (/obwiniam|moja wina/.test(t)) loop = "obwinianie siebie";
  if (/ciągle myślę|wraca|śni|nie mogę przestać/.test(t)) loop = "ruminacje";

  /* ========= NEED ========= */

  let need = "zrozumienie";

  if (state === "kryzys") need = "stabilizacja";
  else if (intent === "action") need = "kierunek";
  else if (intent === "discovery") need = "inspiracja";

  /* ========= PRIORYTET ========= */

  let priority = "odzyskać stabilność";

  if (loop === "ruminacje") priority = "zatrzymać myślenie";
  if (loop === "obwinianie siebie") priority = "zdjąć winę";

  if (intent === "discovery") {
    priority = "wybrać konkretną opcję i ruszyć";
  }

  /* ========= MODE ========= */

  let mode: Analysis["mode"] = "explain";

  if (state === "kryzys") mode = "support";
  else if (intent === "action" || intent === "discovery") mode = "direction";

  /* ========= FINAL ========= */

  return {
    problem,
    state,
    loop,
    need,
    priority,
    mode,
    intent,
  };
}