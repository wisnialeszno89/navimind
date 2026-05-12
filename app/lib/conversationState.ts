export type ConversationState = {
  activeTopic: string;
  activeSubject?: string;
  lastUserFocus?: string;
  conversationIntent?: string;



  emotionalTone:
    | "neutral"
    | "frustrated"
    | "curious"
    | "sad";

  userGoal:
    | "understand"
    | "vent"
    | "solve"
    | "reflect";

  mode:
    | "casual"
    | "technical"
    | "emotional";
};

export function buildConversationState(
  userText: string,
  history: any[]
): ConversationState {
  const t = userText.toLowerCase();

  // 🔹 emocja
  let emotionalTone: ConversationState["emotionalTone"] =
    "neutral";

  if (
    /frustruje|wkurza|chaos|toksyczny|ciągle to samo|ciagle to samo/.test(
      t
    )
  ) {
    emotionalTone = "frustrated";
  } else if (
    /smutne|przykre|samotny|żal/.test(t)
  ) {
    emotionalTone = "sad";
  } else if (
    /dlaczego|po co|czemu/.test(t)
  ) {
    emotionalTone = "curious";
  }

  // 🔹 cel usera
  let userGoal: ConversationState["userGoal"] =
    "reflect";

  if (/jak zrobić|co zrobić|jak mam/.test(t)) {
    userGoal = "solve";
  } else if (
    /dlaczego|po co|czemu/.test(t)
  ) {
    userGoal = "understand";
  } else if (
    emotionalTone === "frustrated"
  ) {
    userGoal = "vent";
  }

  // 🔹 mode
  let mode: ConversationState["mode"] =
    "casual";

  if (
    /typescript|nextjs|api|kod|błąd/.test(t)
  ) {
    mode = "technical";
  } else if (
    emotionalTone === "frustrated" ||
    emotionalTone === "sad"
  ) {
    mode = "emotional";
  }

  // 🔹 temat
  let activeTopic = "general";

  const joined = [
    ...history
      .slice(-6)
      .map((m) => m.content),
    userText,
  ]
    .join(" ")
    .toLowerCase();

  if (
    /kierownik|szef|praca|zespół/.test(
      joined
    )
  ) {
    activeTopic = "konflikt w pracy";
  }

  if (
    /związek|partner|żona|dziewczyna/.test(
      joined
    )
  ) {
    activeTopic = "relacje";
  }
  
let activeSubject = "";
let lastUserFocus = "";

if (
  /kierownik|toksyczny|dominacja|szef/.test(
    joined
  )
) {
  activeSubject =
    "toksyczna osoba dominująca w pracy";
}

if (
  /dominacja|manipulacja|kolejka|toksyczny|kontrola/.test(
    joined
  )
) {
  lastUserFocus =
    "niezrozumiałe zachowania ludzi";
}
let conversationIntent = "";

if (
  /dominacja|wywyższanie|kolejka|manipulacja|toksyczny|kontrola|brak szacunku/.test(
    joined
  )
) {
  conversationIntent =
    "zrozumienie mechanizmów toksycznych zachowań ludzi";
}

return {
  activeTopic,
  activeSubject,
  emotionalTone,
  userGoal,
  mode,
  lastUserFocus,
conversationIntent,
};
}

