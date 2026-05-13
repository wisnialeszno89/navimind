export type ConversationState = {
  activeTopic: string;

  activeEntity?: string;
  pendingAction?: string;
  conversationPhase?:
  | "discovery"
  | "offering"
  | "executing"
  | "clarifying";

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

  const t =
    userText.toLowerCase();

  const shortMessage =
    t.trim().split(" ").length <= 4;

  const vagueContinuation =
    /cos|coś|dawaj|linki|jakieś|polec|pokaż|no|tak|okej|ok/i.test(
      t
    );

  const joined = [
    ...history
      .slice(-8)
      .map((m) => m.content),
    userText,
  ]
    .join(" ")
    .toLowerCase();

  const lastAssistant =
    history
      .filter(
        (m) =>
          m.role === "assistant"
      )
      .slice(-1)[0]?.content
      ?.toLowerCase() || "";
    const previousState =
  history
    .slice()
    .reverse()
    .find(
      (m) =>
        m.role === "system" &&
        m.conversationState
    )?.conversationState;

    if (
  previousState &&
  shortMessage &&
  vagueContinuation
) {
  return {
    ...previousState,
  };
}
  /* =========================
     EMOTIONAL TONE
  ========================= */

  /* =========================
   EMOTIONAL TONE
========================= */

let emotionalTone:
  ConversationState["emotionalTone"] =
    "neutral";

if (
  /frustruje|wkurza|chaos|toksyczny|ciągle to samo|ciagle to samo|mam dość|kurwa|wkurw/.test(
    joined
  )
) {
  emotionalTone =
    "frustrated";

} else if (
  /smutne|przykre|samotny|żal|strata|bez sensu/.test(
    joined
  )
) {
  emotionalTone =
    "sad";

} else if (
  /dlaczego|po co|czemu|jak to działa|o co chodzi/.test(
    joined
  )
) {
  emotionalTone =
    "curious";
}

/* =========================
   USER GOAL
========================= */

let userGoal:
  ConversationState["userGoal"] =
    "reflect";

if (
  /jak zrobić|co zrobić|jak mam|poleć|szukam|daj|znajdź|link|kontakt|gdzie/.test(
    joined
  )
) {
  userGoal = "solve";

} else if (
  /dlaczego|po co|czemu|jak to działa/.test(
    joined
  )
) {
  userGoal =
    "understand";

} else if (
  emotionalTone ===
  "frustrated"
) {
  userGoal = "vent";
}

/* =========================
   CONVERSATION PHASE
========================= */

let conversationPhase:
  ConversationState["conversationPhase"] =
    "discovery";

const affirmativeFollowup =
  /tak|dawaj|ok|okej|jasne|poproszę|no/.test(
    t.trim()
  );

if (
  /mog[eę].*link|chcesz.*link|mog[eę].*pokaza|podrzuc[eę].*miejsce|mam kilka propozycji/.test(
    lastAssistant
  )
) {
  conversationPhase =
    "offering";
}

if (
  conversationPhase ===
    "offering" &&
  affirmativeFollowup
) {
  conversationPhase =
    "executing";
}

if (
  shortMessage &&
  !affirmativeFollowup &&
  !vagueContinuation
) {
  conversationPhase =
    "clarifying";
}

  /* =========================
     MODE
  ========================= */

  let mode:
    ConversationState["mode"] =
      "casual";

  if (
    /typescript|nextjs|api|kod|błąd/.test(
      joined
    )
  ) {
    mode = "technical";
  } else if (
    emotionalTone ===
      "frustrated" ||
    emotionalTone === "sad"
  ) {
    mode = "emotional";
  }

  /* =========================
     GLOBAL TOPIC DETECTION
  ========================= */

  let activeTopic =
    "general";

  let activeEntity = "";
  let pendingAction = "";

  if (
    /kamper|kemping|camping|wakacje|balaton|podróż|wegry|węgry/.test(
      joined
    )
  ) {
    activeTopic =
      "podróże i wakacje";
  }

  if (
    /mechanik|samochód|auto|silnik|dym spod maski/.test(
      joined
    )
  ) {
    activeTopic =
      "motoryzacja";
  }

  if (
    /związek|żona|partner|ex|dzieci|rozwód/.test(
      joined
    )
  ) {
    activeTopic =
      "relacje";
  }

  if (
    /kod|nextjs|typescript|api|vercel/.test(
      joined
    )
  ) {
    activeTopic =
      "programowanie";
  }

  /* =========================
     ENTITY DETECTION
  ========================= */

  const entityPatterns = [
    "balaton",
    "budapeszt",
    "mazda",
    "bmw",
    "kamper",
    "dzieci",
    "pies",
    "vercel",
    "nextjs",
    "typescript",
  ];

  for (const entity of entityPatterns) {
    if (
      joined.includes(entity)
    ) {
      activeEntity =
        entity;
      break;
    }
  }

  /* =========================
     PENDING ACTIONS
  ========================= */

  if (
    /mog[eę].*link|podrzuc[eę].*link|chcesz.*link/.test(
      lastAssistant
    )
  ) {
    if (
  /kamper|kemping|camping|balaton/.test(
    joined
  )
) {
  pendingAction =
    "provide_camping_links";
} else {
  pendingAction =
    "provide_links";
}
  }

  if (
    /mog[eę].*zdjęci|pokazać.*miejsce/.test(
      lastAssistant
    )
  ) {
    pendingAction =
      "show_examples";
  }

  if (
    /polec|rekomend|szukam|gdzie/.test(
      joined
    )
  ) {
    pendingAction =
      "provide_recommendations";
  }

  /* =========================
     SUBJECT / FOCUS
  ========================= */

  let activeSubject = "";
  let lastUserFocus = "";
  let conversationIntent =
    "";

  if (
    /toksyczny|manipulacja|dominacja|kontrola/.test(
      joined
    )
  ) {
    activeSubject =
      "toksyczne zachowania";

    lastUserFocus =
      "zrozumienie zachowań ludzi";

    conversationIntent =
      "analiza toksycznych relacji";
  }

  /* =========================
     RETURN
  ========================= */

  return {
    activeTopic,
    activeEntity,
    pendingAction,

    activeSubject,
    lastUserFocus,
    conversationIntent,

    emotionalTone,
    userGoal,
    mode,
  };
}