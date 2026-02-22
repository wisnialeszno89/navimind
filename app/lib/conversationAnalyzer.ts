export type ConversationMode =
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

  /* ===== 1. WYSOKIE NAPIĘCIE ===== */

  const highEmotion =
    /(boję|nienawidzę|mam dość|nie wytrzymam|to boli|bez sensu|załamany|rozbity|wkurw|pojeb)/i.test(
      text
    );

  /* ===== 2. JĘZYK OBWINIANIA ===== */

  const blameLanguage =
    /(ona|on|oni|zawsze|nigdy|wszyscy|to przez|winna|wina)/i.test(text);

  /* ===== 3. KONTEKST DZIECI / ODPOWIEDZIALNOŚCI ===== */

  const childrenContext =
    /(dzieci|córka|syn|alimenty|opieka|ojciec|matka|rodzic)/i.test(text);

  /* ===== 4. POWTARZALNOŚĆ TEMATU ===== */

  const lastUserMessages = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content.toLowerCase());

  const repeatedTopic = lastUserMessages.some((msg) =>
    msg.slice(0, 50) === text.slice(0, 50)
  );

  /* ===== PRIORYTETY DECYZJI ===== */

  // 1️⃣ Najpierw regulujemy silne emocje
  if (highEmotion) return "stabilize";

  // 2️⃣ Jeśli temat dotyczy dzieci i jest język obwiniania
  if (childrenContext && blameLanguage) return "mentor";

  // 3️⃣ Jeśli użytkownik krąży wokół tego samego
  if (repeatedTopic) return "clarify";

  // 4️⃣ Jeśli głównie obwinia innych
  if (blameLanguage) return "confront";

  // 5️⃣ W innych przypadkach realizm
  return "realism";
}