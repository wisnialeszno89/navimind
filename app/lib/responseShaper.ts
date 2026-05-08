import { ConversationMode } from "./conversation/detectConversationMode";
import { formatResponse } from "./formatResponse";


type ShapeInput = {
  text: string;
  intent?: string;
  userText?: string;
  mode?: ConversationMode;
  userStyle?: string;
  userType?: string;
  topics?: any;
  patterns?: any;
  prediction?: string;
  decisionNudge?: string;
  actions?: any;
  progress?: any;
  returnContext?: string;
  isSensitive?: boolean;
  score?: { score: number; label: string };
  recentEffects?: { type: string; ts: number }[];
  };

// 🔹 usuwa AI-fluff
function removeAiFluff(text: string) {
  return text.replace(
    /^(Rozumiem|Widzę|To brzmi|Dziękuję za podzielenie się|Masz rację|Czuję, że)[^.\n]*[.\n]+/i,
    ""
  );
}

function removeRepetitions(text: string) {
  return text
    .replace(/^No właśnie[, ]*/i, "")
    .replace(/^Wiesz co[, ]*/i, "")
    .replace(/^Trochę to wygląda jak[, ]*/i, "");
}

// 🔹 skraca gdy user pisze krótko
function adaptLength(text: string, userText?: string) {
  if (!userText) return text;

  if (userText.length < 120) {
    const paragraphs = text.split("\n\n");

    return paragraphs.slice(0, 2).join("\n\n");
  }

  return text;
}
function detectHiddenLayer(text: string) {
  const t = text.toLowerCase();

  if (/mam dość|męczą|zmęczony/.test(t)) return "overload";
  if (/czemu|dlaczego/.test(t)) return "seeking";
  if (/ok|haha|xd/.test(t)) return "low";

  return null;
}
function addMemoryEcho(text: string, microDetail?: string) {
  if (!microDetail) return text;

  if (Math.random() < 0.4) {
    return `${text}\n\nWidać, że to się u Ciebie powtarza.`;
  }

  return text;
}

function addSoftChallenge(text: string, userText: string) {
  if (/ludzie/.test(userText.toLowerCase())) {
    return text + "\n\nTylko pytanie, czy to na pewno tylko o nich.";
  }

  return text;
}
function addTopicCallback(text: string, topics?: string[]) {
  if (!topics || topics.length === 0) return text;

  if (Math.random() < 0.3) {
    const topic = topics[0];

   const variants = [
  `I co, ruszyłeś coś w tym kierunku?`,
  `Udało się chociaż trochę to ruszyć?`,
  `Zrobiłeś choć kawałek tego?`,
  Math.random() < 0.3 ? `Wraca mi to, o czym mówiłeś wcześniej.` : "",
  ];

    const pick = variants[Math.floor(Math.random() * variants.length)];

    return pick + "\n\n" + text;
  }

  return text;
}
function addPatternReflection(text: string, patterns?: string[]) {
  if (!patterns || patterns.length === 0) return text;

  if (Math.random() < 0.35) {
    const pattern = patterns[0];

    const variants = [
      `Mam wrażenie, że ${pattern}.`,
      `To trochę wygląda jak coś, co już się u Ciebie pojawiało.`,
      `Jakbyś kręcił się wokół tego samego punktu.`,
    ];

    const pick = variants[Math.floor(Math.random() * variants.length)];

    return pick + "\n\n" + text;
  }

  return text;
}
function addPrediction(text: string, prediction?: string) {
  if (!prediction) return text;

  if (Math.random() < 0.35) {
    const variants = [
      `Mam wrażenie, że ${prediction}.`,
      `Zaraz może się to potoczyć tak, że ${prediction}.`,
      `Często w takich momentach ${prediction}.`,
    ];

    const pick = variants[Math.floor(Math.random() * variants.length)];

    return text + "\n\n" + pick;
  }

  return text;
}
function addDecisionNudge(text: string, nudge?: string) {
  if (!nudge) return text;

  if (Math.random() < 0.4) {
    const variants = [
      `Możesz spróbować czegoś prostego — ${nudge}.`,
      `Na teraz wystarczy jeden ruch — ${nudge}.`,
      `Nie musisz ogarniać wszystkiego — ${nudge}.`,
    ];

    const pick = variants[Math.floor(Math.random() * variants.length)];

    return text + "\n\n" + pick;
  }

  return text;
}
function addActionCheck(text: string, actions?: string[]) {
  if (!actions || actions.length === 0) return text;

  if (Math.random() < 0.3) {
    const last = actions[0];

    const variants = [
      `Jak Ci poszło z tym — ${last}?`,
      `Udało się zrobić choć kawałek tego: ${last}?`,
      `Wraca do mnie to, co mówiłeś — ${last}. Coś z tym ruszyło?`,
    ];

    const pick = variants[Math.floor(Math.random() * variants.length)];

    return text + "\n\n" + pick;
  }

  return text;
}
function addProgressSignal(text: string, progress?: string) {
  if (!progress) return text;

  if (Math.random() < 0.3) {
    const variants = [
      `Widać, że ${progress}.`,
      `To wygląda jak moment, gdzie ${progress}.`,
      `Coś się tu przesuwa — ${progress}.`,
    ];

    const pick = variants[Math.floor(Math.random() * variants.length)];

    return text + "\n\n" + pick;
  }

  return text;
}
function addReturnHook(text: string, returnContext?: string) {
  if (!returnContext) return text;

  if (Math.random() < 0.35) {
    const variants = {
      short: [
        "Znowu to wraca.",
        "No i jesteśmy z powrotem w tym miejscu.",
      ],
      medium: [
        "To chyba dalej gdzieś siedzi.",
        "Nie puściło Cię to, co.",
      ],
      long: [
        "Minęło trochę czasu, a to dalej wraca.",
        "Widzę, że temat nie odpuścił.",
      ],
    };

    const pool = variants[returnContext as keyof typeof variants];
    if (!pool) return text;

    const pick = pool[Math.floor(Math.random() * pool.length)];

    // 🔥 TU DOKŁADNIE DODAJESZ IF
    if (Math.random() < 0.5) {
      return `${pick}\n\n${text}`;
    } else {
      return `${pick} ${text}`;
    }
  }

  return text;
}
function adaptToUserStyle(text: string, style?: string) {
  if (!style) return text;

  // 🔹 DIRECT
  if (style === "direct") {
  if (text.length > 350) {
    return text.slice(0, 350).trim() + "...";
  }
}

  // 🔹 CHAOTIC
  if (style === "chaotic") {
    if (Math.random() < 0.4) {
      return text + "\n\nTrochę odklejone, ale działa.";
    }
  }

  // 🔹 EMOTIONAL
  if (style === "emotional") {
    return "Brzmi jak coś, co naprawdę Cię rusza.\n\n" + text;
  }

  // 🔹 REFLECTIVE
  if (style === "reflective") {
    return text + "\n\nTo ma trochę więcej warstw niż się wydaje.";
  }

  return text;
}
function addMicroConflict(
  text: string,
  userText: string,
  userType?: string,
  isSensitive?: boolean
) {
  // 🔒 BLOKADA (TU!)
  if (isSensitive) return text;

  if (!userText || userText.length < 20) return text;

  if (Math.random() > 0.25) return text;

  const t = userText.toLowerCase();

  if (/ludzie|oni|wszyscy/.test(t)) {
    return text + "\n\nTylko pytanie, czy to na pewno tylko o nich.";
  }

  if (/nie mogę|nie da się|nie działa/.test(t)) {
    return text + "\n\nA jesteś pewien, że to naprawdę niemożliwe?";
  }

  if (/zawsze|ciągle/.test(t)) {
    return text + "\n\nZawsze… czy tak to teraz czujesz?";
  }

  const variants = [
    "Tylko czy to na pewno cała historia?",
    "Coś tu może być jeszcze pod spodem.",
    "Pytanie, czy to tak wygląda z każdej strony.",
  ];

  const pick = variants[Math.floor(Math.random() * variants.length)];

  return text + "\n\n" + pick;
}
function applyAutoTuning(
  text: string,
  score?: { score: number; label: string }
) {
  if (!score) return text;

  // 🔻 LOW → za słabe, trzeba poprawić
  if (score.label === "low") {
    // skróć i dodaj napięcie
    const shorter = text.split(".").slice(0, 2).join(".") + ".";

    return (
      shorter +
      "\n\nCoś tu chyba nie trafia do końca."
    );
  }

  // 🟡 MEDIUM → lekkie podbicie
  if (score.label === "medium") {
    if (Math.random() < 0.4) {
      return text + "\n\nMoże tu jest coś więcej.";
    }
  }

  // 🟢 HIGH → nie ruszaj
  return text;
}
export function refineResponse(
  text: string,
  score?: { score: number; label: string }
) {
  if (!score) return text;

  // 🔻 LOW → coś nie siadło
  if (score.label === "low") {
    const shorter = text.split(".").slice(0, 2).join(".") + ".";

    return (
      shorter +
      "\n\nPowiedz wprost — co tu najbardziej Cię wkurza?"
    );
  }

  // 🟡 MEDIUM → lekki boost
  if (score.label === "medium") {
    if (Math.random() < 0.4) {
      return text + "\n\nMoże tu jest coś jeszcze.";
    }
  }
function addPatternReflection(text: string, patterns?: any) {
  if (!patterns) return text;

  // 🔒 blokada: nie powtarzaj w tej samej odpowiedzi
  if (text.includes("Widać, że to się u Ciebie powtarza")) {
    return text;
  }

  if (Math.random() > 0.3) return text;

  const variants = [
  "Widać, że to się u Ciebie powtarza.",
  "To nie wygląda na jednorazową sytuację.",
  "Jakby ten schemat wracał co jakiś czas.",
];

const pick = variants[Math.floor(Math.random() * variants.length)];

return text + "\n\n" + pick;
}
  // 🟢 HIGH → zostaw
  return text;
}
function isOnCooldown(
  effects: { type: string; ts: number }[] | undefined,
  type: string,
  cooldownMs: number
) {
  if (!effects) return false;

  const now = Date.now();

  return effects.some(
    (e) => e.type === type && now - e.ts < cooldownMs
  );
}
function limitQuestions(text: string) {
  const matches = text.match(/\?/g);

  if (!matches || matches.length <= 1) {
    return text;
  }

  let firstFound = false;

  return text.replace(/\?/g, () => {
    if (!firstFound) {
      firstFound = true;
      return "?";
    }

    return ".";
  });
}
function removeWeakOpeners(text: string) {
  return text
    .replace(/^To zależy[^.]*\./i, "")
    .replace(/^Zacznijmy od[^.]*\./i, "")
    .replace(/^Warto zastanowić się[^.]*\./i, "")
    .replace(/^Pytanie kluczowe[^.]*\./i, "")
    .replace(/^No właśnie[, ]*/i, "")
    .replace(/^Szczerze[, ]*/i, "")
    .replace(/^Wiesz co[, ]*/i, "");
}
function removeCorporateTone(text: string) {
  return text
    .replace(/realny potencjał/gi, "potencjał")
    .replace(/mierzalne cele/gi, "konkretny plan")
    .replace(/zasoby/gi, "czas i możliwości")
    .replace(/w perspektywie 6-12 miesięcy/gi, "w najbliższym czasie")
    .replace(/skalować/gi, "rozwinąć")
    .replace(/targetowanie/gi, "trafienie do właściwych ludzi")
    .replace(/konwersję/gi, "reakcję ludzi");
}
function humanizeTone(text: string) {
  return text
    .replace(/Jeśli chcesz szybko i realnie podnieść ruch/gi, "Szczerze? Żeby realnie podnieść ruch")
    .replace(/warto ogarnąć/gi, "najpierw trzeba ogarnąć")
    .replace(/wyraźna komunikacja wartości/gi, "jasny przekaz")
    .replace(/Twoi potencjalni klienci/gi, "ludzie, którzy mogą tego używać")
    .replace(/zainteresowanie to najlepszy wskaźnik/gi, "zainteresowanie najlepiej pokazuje")
}
function removeAiClosings(text: string) {
  return text
    .replace(/Jeśli chcesz, mogę pomóc[^.]*\./gi, "")
    .replace(/Mogę też pomóc[^.]*\./gi, "")
    .replace(/Jeśli chcesz, mogę[^.]*\./gi, "");
}
function removeAiConclusions(text: string) {
  return text
    .replace(/Podsumowując[:,]?/gi, "")
    .replace(/W skrócie[:,]?/gi, "")
    .replace(/Krótko mówiąc[:,]?/gi, "")
    .replace(/Finalnie[:,]?/gi, "");
}
function trimOverExplaining(
  text: string,
  mode?: string
) {
  if (mode !== "casual") return text;

  const parts = text.split("\n\n");

  if (parts.length > 4) {
    return parts.slice(0, 4).join("\n\n");
  }

  return text;
}
function reduceOvercertainty(text: string) {
  return text
    .replace(/To jest właśnie/gi, "Czasem to jest")
    .replace(/To pokazuje/gi, "To może pokazywać")
    .replace(/To oznacza/gi, "To często oznacza")
    .replace(/Ludzie są/gi, "Część ludzi jest");
}

// 🔥 MAIN
export function shapeResponse({
  text,
  userText = "",
  mode = "casual",
  userStyle,
  userType,
}: ShapeInput) {
  let output = text.trim();

  // 🔹 podstawowe czyszczenie
 // 🔹 zmniejsz sztuczną pewność
output = reduceOvercertainty(output);

// 🔹 mniej przesadnego tłumaczenia
output = trimOverExplaining(output, mode);

// 🔹 skracanie dla krótkich wiadomości
output = adaptLength(output, userText);

// 🔹 ogranicz ilość pytań
output = limitQuestions(output);

// 🔹 miękkie domknięcie bez psucia kontekstu
if (
  mode === "casual" &&
  Math.random() < 0.06
) {
  const softEnds = [
    "",
    "",
    "\n\nTo bywa bardziej złożone niż wygląda.",
    "\n\nLudzie często nawet tego u siebie nie widzą.",
  ];

  output +=
    softEnds[
      Math.floor(
        Math.random() * softEnds.length
      )
    ];
}
  // 🔹 styl usera
  if (userStyle && Math.random() < 0.35) {
    output = adaptToUserStyle(
      output,
      userStyle
    );
  }

  // 🔹 usuń powtórzenia
  output = removeRepetitions(output);

  // 🔹 final cleanup
  output = output
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  return {
    text: formatResponse(output),
    usedEffect: null,
  };
}