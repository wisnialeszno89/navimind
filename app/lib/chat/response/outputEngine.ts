/* =========================
   CLEAN & SHAPE
   ========================= */

export function cleanAndShapeOutput(raw: string): string {
  let text = (raw || "").trim();

  if (!text) {
    return "Powiedz to jeszcze raz — złapiemy to dokładniej.";
  }

  // usuń śmieci końcowe
  text = text.replace(/\.\.\.+$/, "");
  text = text.replace(/,+$/, "");
  text = text.replace(/:\s*$/, "");

  // normalizacja spacji
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/* =========================
   REMOVE DUPLICATES
   ========================= */

export function removeRepeatEndings(text: string): string {
  if (!text) return text;

  const lines = text.split("\n");

  const unique: string[] = [];
  const seen = new Set();

  for (const l of lines) {
    const key = l.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(l);
    }
  }

  return unique.join("\n").trim();
}

/* =========================
   OPTIONAL: TRIM LENGTH
   ========================= */

export function trimSentencesSmart(text: string, userText: string): string {
  const sentences = text.split(".").map(s => s.trim()).filter(Boolean);

  // 🔥 wykrycie trybu
  const t = userText.toLowerCase();

  const isCrisis = /nie chce mi się żyć|bez sensu|rozsypało się/.test(t);
  const isSimple = /co to|dlaczego|ile/.test(t);
  const isComplex = /co robić|jak działać|krok po kroku/.test(t);

  let max = 4; // default

  if (isCrisis) max = 3;
  else if (isSimple) max = 3;
  else if (isComplex) max = 5;

  if (sentences.length <= max) return text;

  return sentences.slice(0, max).join(". ") + ".";
}
export function fixCutOff(text: string): string {
  if (!text) return text;

  // ❌ końcówki które oznaczają ucięcie
  const badEndings = [
    "np.",
    "na przykład",
    "można",
    "można też",
    "np",
    "na przykład:",
  ];

  for (const ending of badEndings) {
    if (text.trim().toLowerCase().endsWith(ending)) {
      // utnij ostatnie zdanie całkowicie
      const parts = text.split(".");
      parts.pop();
      return parts.join(".").trim() + ".";
    }
  }

  return text;
}
//export function addSmartQuestion(text: string, userText: string): string {
  //if (/wyjazd|kamper/.test(userText)) {
    //return text + "\n\nChcesz bardziej dziko czy z dostępem do miasta?";
  //}

  //if (/dzieci|sąd/.test(userText)) {
  //  return text + "\n\nMasz już jakiś kontakt z dziećmi czy całkowita blokada?";
  //}

  //return text;
//}
export function formatResponse(text: string): string {
  let t = (text || "").trim();

  if (!t) return t;

  // 🔥 spacing
  t = t.replace(/\n{3,}/g, "\n\n");

  // 🔥 większe odstępy po kropkach
  t = t.replace(/([.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/g, "$1\n\n");

  // 🔥 lekkie podkreślenie ważnych rzeczy
  t = t.replace(
    /(najgorsze|najważniejsze|problem jest taki|sedno jest takie)/gi,
    "**$1**"
  );

  // 🔥 lekkie emocjonalne pacing
  const emotional =
    /bezsilność|samotność|strata|ból|wkurwia|przytłacza/i.test(t);

  if (emotional && !t.includes("😐")) {
    t = "😐 " + t;
  }

  // 🔥 unikaj ściany tekstu
  const parts = t.split("\n\n");

  t = parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");

  return t.trim();
}