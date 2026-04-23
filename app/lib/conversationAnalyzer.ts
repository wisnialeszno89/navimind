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

type ChatMessage = {
  role: string;
  content: string;
};

export function analyzeConversation(
  userText: string,
  history: ChatMessage[]
): ConversationAnalysis {
  const text = userText.toLowerCase();

  // ===== PRIORYTETY =====
  // 1. crisis
  // 2. high emotion
  // 3. repeated topic
  // 4. relational conflict
  // 5. fallback

  /* ===== KONTEKST TECHNICZNY / PRAWNY ===== */

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

  if (crisisSignal) {
    return { mode: "crisis", simplified: false };
  }

  /* ===== EMOCJE ===== */

  const highEmotion =
    /(boję|nienawidzę|mam dość|nie wytrzymam|to boli|załamany|rozbity|wkurw|pojeb)/i.test(
      text
    );

  /* ===== WZORCE RELACYJNE ===== */

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

  /* ===== HISTORIA ===== */

  const lastUserMessages = history
    .filter((m: ChatMessage) => m.role === "user")
    .slice(-3)
    .map((m: ChatMessage) => m.content.toLowerCase());

  const repeatedTopic = lastUserMessages.some(
    (msg: string) =>
      msg.includes(text.slice(0, 40)) ||
      text.includes(msg.slice(0, 40))
  );

  /* ===== LOGIKA ===== */

  if (childrenContext && blameLanguage) {
    return { mode: "realism", simplified: false };
  }

  if (institutionalEscalation && childrenContext) {
    return { mode: "mentor", simplified: false };
  }

  if (identityHit && childrenContext) {
    return { mode: "mentor", simplified: false };
  }

  if (highEmotion && !technicalContext) {
    return { mode: "stabilize", simplified: false };
  }

  if (repeatedTopic) {
    return { mode: "clarify", simplified: false };
  }

  if (blameLanguage) {
    return { mode: "confront", simplified: false };
  }

  if (simplificationPattern && !highEmotion) {
    return { mode: "mentor", simplified: true };
  }

  /* ===== FALLBACK ===== */

  return {
    mode: "realism",
    simplified: simplificationPattern === true,
  };
}