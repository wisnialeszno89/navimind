import { isContinuation } from "./isContinuation";

export type ConversationState = {
  activeTopic: string;

  activeIntent:
    | "travel"
    | "recommendation"
    | "coding"
    | "relationship"
    | "emotional"
    | "planning"
    | "general";

  activeEntities: string[];

  resolvedEntities: Record<
    string,
    {
      type: string;
      confidence: number;
    }
  >;

  userGoal?: string;

  lastAssistantAction?: string;

  continuityStrength: number;

  lastUpdated: number;
};

function detectIntent(text: string): ConversationState["activeIntent"] {
  const t = text.toLowerCase();

  if (
    /kamper|podróż|podroz|wyjazd|góry|gory|wakacje|kemping|szlak|trasa|nocleg/.test(
      t
    )
  ) {
    return "travel";
  }

  if (
    /poleć|polecisz|rekomend|jaki kupić|co wybrać|ranking/.test(
      t
    )
  ) {
    return "recommendation";
  }

  if (
    /nextjs|typescript|react|vercel|api|backend|frontend|kod|bug|błąd/.test(
      t
    )
  ) {
    return "coding";
  }

  if (
    /żona|partner|partnerka|dziewczyna|związek|rozwód|ex/.test(
      t
    )
  ) {
    return "relationship";
  }

  if (
    /plan|strategia|krok po kroku|działanie|co robić/.test(
      t
    )
  ) {
    return "planning";
  }

  if (
    /mam dość|smutno|samotny|depresja|wkurza|frustruje/.test(
      t
    )
  ) {
    return "emotional";
  }

  return "general";
}

function detectTopic(text: string): string {
  const t = text.toLowerCase();

  if (
    /wielka sowa|góry sowie|gory sowie/.test(t)
  ) {
    return "trip to Wielka Sowa";
  }

  if (
    /kamper|camping|kemping/.test(t)
  ) {
    return "camper travel";
  }

  if (
    /nextjs|typescript|vercel|api/.test(t)
  ) {
    return "programming";
  }

  if (
    /związek|rozwód|partnerka|żona/.test(t)
  ) {
    return "relationship";
  }

  return "general";
}

function detectGoal(text: string): string {
  const t = text.toLowerCase();

  if (
    /gdzie|poleć|znajdź|szukam|jaki|jaka|jakie/.test(t)
  ) {
    return "find recommendations";
  }

  if (
    /jak zrobić|jak działa|dlaczego/.test(t)
  ) {
    return "understand";
  }

  if (
    /plan|krok po kroku/.test(t)
  ) {
    return "create plan";
  }

  return "general";
}

function extractEntities(text: string): string[] {
  const t = text.toLowerCase();

  const knownEntities = [
    "wielka sowa",
    "kamper",
    "nextjs",
    "typescript",
    "vercel",
    "balaton",
    "mazda",
    "bmw",
  ];

  return knownEntities.filter((e) =>
    t.includes(e)
  );
}

function buildResolvedEntities(
  entities: string[]
): ConversationState["resolvedEntities"] {
  const resolved: ConversationState["resolvedEntities"] =
    {};

  for (const entity of entities) {
    if (entity === "wielka sowa") {
      resolved[entity] = {
        type: "mountain",
        confidence: 0.95,
      };
    } else if (entity === "nextjs") {
      resolved[entity] = {
        type: "framework",
        confidence: 0.95,
      };
    } else if (entity === "vercel") {
      resolved[entity] = {
        type: "platform",
        confidence: 0.95,
      };
    } else if (entity === "kamper") {
      resolved[entity] = {
        type: "vehicle",
        confidence: 0.9,
      };
    } else {
      resolved[entity] = {
        type: "general",
        confidence: 0.7,
      };
    }
  }

  return resolved;
}

export function buildConversationState(
  userText: string,
  history: any[],
  previousState?: ConversationState
): ConversationState {
  const current =
    userText.toLowerCase();

  const recentMessages =
    history.slice(-6);

  const recentText =
    recentMessages
      .map((m) => m.content || "")
      .join(" ")
      .toLowerCase();

  // 🔥 CONTINUATION INHERITANCE
  if (
    previousState &&
    isContinuation(userText)
  ) {
    const mergedEntities = [
      ...new Set([
        ...previousState.activeEntities,
        ...extractEntities(current),
      ]),
    ];

    return {
      ...previousState,

      activeEntities:
        mergedEntities,

      resolvedEntities: {
        ...previousState.resolvedEntities,
        ...buildResolvedEntities(
          mergedEntities
        ),
      },

      continuityStrength:
        previousState.continuityStrength + 1,

      lastUpdated:
        Date.now(),
    };
  }

  // 🔥 FRESH STATE
  const activeIntent =
    detectIntent(
      `${recentText} ${current}`
    );

  const activeTopic =
    detectTopic(
      `${recentText} ${current}`
    );

  const activeEntities =
    extractEntities(
      `${recentText} ${current}`
    );

  return {
    activeTopic,

    activeIntent,

    activeEntities,

    resolvedEntities:
      buildResolvedEntities(
        activeEntities
      ),

    userGoal:
      detectGoal(current),

    lastAssistantAction:
      undefined,

    continuityStrength: 1,

    lastUpdated:
      Date.now(),
  };
}