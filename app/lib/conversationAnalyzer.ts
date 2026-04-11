export type ConversationMode =
  | "crisis"
  | "stabilize"
  | "clarify"
  | "confront"
  | "realism"
  | "mentor";

export type ConversationAnalysis = {
  mode: ConversationMode;
  simplified: boolean;
};
export function analyzeConversation(
  userText: string,
  history: { role: string; content: string }[]
): ConversationAnalysis {
  const text = userText.toLowerCase();

  /* ===== KONTEKST TECHNICZNY / PRAWNY — NIE NAZYWAJ EMOCJI ===== */

  const technicalContext =
    /(straż|policja|mandat|auto|samochód|parking|przegląd|dowód rejestracyjny|holowanie|kara|przepis|prawo|sąd|urzęd|wniosek|podatek|umowa|faktura|vercel|kod|deploy|api|repo|git)/i.test(
      text
    );

  if (technicalContext) {
    return { mode: "realism", simplified: false };
  }

  /* ===== KRYZYS ===== */

  const crisisSignal =
    /(nie chce mi się żyć|nie chce mi sie zyc|nie widze sensu zyc|mam dosc zycia|chce zniknac|zabij(e|ę) się|chce sie zabic)/i.test(
      text
    );

  if (crisisSignal) return { mode: "crisis", simplified: false };

  /* ===== EMOCJE ===== */
  const frustration =
  /(kurde|wkurza|bez sensu|co za|masakra|pojeba|idiotyczne)/i.test(text);

  if (frustration)
  return { mode: "realism", simplified: false };
  const highEmotion =
    /(boję|nienawidzę|mam dość|nie wytrzymam|to boli|bez sensu|załamany|rozbity|wkurw|pojeb)/i.test(
      text
    );

  const blameLanguage =
    /(to przez|jej wina|jego wina|wszyscy są|ona zawsze|on zawsze)/i.test(text);

  const childrenContext =
    /(dzieci|córka|syn|alimenty|opieka|ojciec|matka|rodzic)/i.test(text);

  const institutionalEscalation =
    /(niebiesk|sąd|policja|sprawa|kurator|adwokat|prokurator)/i.test(text);

  const identityHit =
    /(zdrada|oszukała|zniszczyła mi życie|wszystko straciłem|nie mam już nic|jestem nikim)/i.test(
      text
    );

  const simplificationPattern =
    /(gdybym miał|gdybym zarabiał|wystarczy że|jak tylko|wszystko przez|potrzebuję tylko|więcej kasy|lepszy status)/i.test(
      text
    );

  const lastUserMessages = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content.toLowerCase());

  const repeatedTopic = lastUserMessages.some((msg) =>
    msg.slice(0, 60) === text.slice(0, 60)
  );

  if (childrenContext && blameLanguage)
    return { mode: "realism", simplified: false };

  if (institutionalEscalation && childrenContext)
    return { mode: "mentor", simplified: false };

  if (identityHit && childrenContext)
    return { mode: "mentor", simplified: false };

  if (highEmotion && !technicalContext)
    return { mode: "stabilize", simplified: false };

  if (repeatedTopic)
    return { mode: "clarify", simplified: false };

  if (blameLanguage)
    return { mode: "confront", simplified: false };

  return { mode: "realism", simplified: simplificationPattern === true };
}