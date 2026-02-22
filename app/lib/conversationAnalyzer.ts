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

  /* ===== 5. UPADek TOŻSAMOŚCI (rola męża/ojca) ===== */

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

  /* ===== PRIORYTETY DECYZJI ===== */

  // 1️⃣ Sprawy dzieci + konflikt odpowiedzialności
  if (childrenContext && blameLanguage) return "mentor";

  // 2️⃣ Instytucje + konflikt rodzinny
  if (institutionalEscalation && childrenContext) return "mentor";

  // 3️⃣ Uderzenie w tożsamość (zdrada, utrata roli)
  if (identityHit && childrenContext) return "mentor";

  // 4️⃣ Bardzo wysokie napięcie emocjonalne
  if (highEmotion) return "stabilize";

  // 5️⃣ Krążenie wokół tego samego tematu
  if (repeatedTopic) return "clarify";

  // 6️⃣ Dominujące obwinianie innych
  if (blameLanguage) return "confront";

  // 7️⃣ Domyślnie realizm
  return "realism";
}