export type ConversationMode =
  | "crisis"
  | "stabilize"
  | "clarify"
  | "confront"
  | "realism"
  | "mentor";

export function analyzeConversation(
  userText: string,
  history: { role: string; content: string }[]
): ConversationMode {
  const text = userText.toLowerCase();

  /* ===== 0. TRYB KRYZYSOWY (NAJWYŻSZY PRIORYTET) ===== */

  const crisisSignal =
    /(nie chce mi się żyć|nie chce mi sie zyc|chce zniknac|mam dosc zycia|nie widze sensu zyc|zabic sie)/i.test(
      text
    );

  if (crisisSignal) return "crisis";

  /* ===== 1. SILNE EMOCJE ===== */

  const highEmotion =
    /(boję|nienawidzę|mam dość|nie wytrzymam|to boli|bez sensu|załamany|rozbity|wkurw|pojeb|zdradziła|zdrada)/i.test(
      text
    );

  /* ===== 2. JĘZYK OBWINIANIA ===== */

  const blameLanguage =
    /(ona|on|oni|zawsze|nigdy|wszyscy|to przez|winna|wina)/i.test(text);

  /* ===== 3. KONTEKST DZIECI ===== */

  const childrenContext =
    /(dzieci|córka|syn|alimenty|opieka|ojciec|matka|rodzic)/i.test(text);

  /* ===== 4. INSTYTUCJONALNA ESKALACJA ===== */

  const institutionalEscalation =
    /(niebiesk|sąd|policja|sprawa|kurator|adwokat|prokurator)/i.test(text);

  /* ===== 5. UDERZENIE W TOŻSAMOŚĆ ===== */

  const identityHit =
    /(zdrada|oszukała|zniszczyła mi życie|wszystko straciłem|nie mam już nic)/i.test(
      text
    );

  /* ===== 6. POWTARZALNOŚĆ TEMATU ===== */

  const lastUserMessages = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content.toLowerCase());

  const repeatedTopic = lastUserMessages.some((msg) =>
    msg.slice(0, 60) === text.slice(0, 60)
  );

  /* ===== PRIORYTETY ===== */

  if (childrenContext && blameLanguage) return "mentor";
  if (institutionalEscalation && childrenContext) return "mentor";
  if (identityHit && childrenContext) return "mentor";
  if (highEmotion) return "stabilize";
  if (repeatedTopic) return "clarify";
  if (blameLanguage) return "confront";

  return "realism";
}