type ShapeInput = {
  text: string;
  intent?: string;
  userText?: string;
  mode?: "casual" | "reflective" | "deep";
  microDetail?: string;
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
};

// 🔹 usuwa AI-fluff
function removeAiFluff(text: string) {
  return text.replace(
    /^(Rozumiem|Widzę|To brzmi|Dziękuję za podzielenie się|Masz rację|Czuję, że)[^.\n]*[.\n]+/i,
    ""
  );
}

// 🔹 lekki ludzki start
function addHumanTouch(text: string, mode: string) {
  if (mode === "casual") return text;

  // 🔥 tylko czasem
  if (Math.random() > 0.2) return text;

  const starters = [
    "Wiesz co…",
    "Szczerze?",
    "Mam wrażenie, że…",
  ];

  const pick = starters[Math.floor(Math.random() * starters.length)];

  return `${pick}\n\n${text}`;
}
function removeRepetitions(text: string) {
  return text
    .replace(/^No właśnie[, ]*/i, "")
    .replace(/^Wiesz co[, ]*/i, "")
    .replace(/^Trochę to wygląda jak[, ]*/i, "");
}
// 🔹 niedomknięcie
function addLooseEnding(text: string, mode?: string) {
  if (mode === "deep") return text;

  const endings = [
    "",
    "\n\nCoś w tym jest.",
    "\n\nTrochę to wszystko się łączy.",
  ];

  return text + endings[Math.floor(Math.random() * endings.length)];
}

// 🔹 skraca gdy user pisze krótko
function adaptLength(text: string, userText?: string) {
  if (!userText) return text;

  if (userText.length < 40) {
    return text.split(".").slice(0, 2).join(".") + ".";
  }

  return text;
}
// 🔹 dodatki
function softenTone(text: string) {
  return text
    .replace(/^Bo /, "Często to jest tak, że ")
    .replace(/Ludzie/g, "Część ludzi")
    .replace(/Zawsze/g, "Często");
}

function randomBreak(text: string) {
  if (Math.random() < 0.3) {
    return text.split(".")[0] + ".";
  }
  return text;
}
function addHook(text: string, mode?: string) {
  if (mode === "deep") return text;

  const hooks = [
    "",
    "\n\nI to zwykle nie jest przypadek.",
    "\n\nI tu się robi ciekawie.",
    "\n\nBo to często nie chodzi tylko o to.",
  ];

  return text + hooks[Math.floor(Math.random() * hooks.length)];
}

function detectHiddenLayer(text: string) {
  const t = text.toLowerCase();

  if (/mam dość|męczą|zmęczony/.test(t)) return "overload";
  if (/czemu|dlaczego/.test(t)) return "seeking";
  if (/ok|haha|xd/.test(t)) return "low";

  return null;
}

function injectDeeperResponse(text: string, userText: string) {
  const layer = detectHiddenLayer(userText);

  if (layer === "overload") {
    return "Brzmi jakbyś miał tego za dużo.\n\n" + text;
  }

  if (layer === "seeking") {
    return "To pytanie raczej nie jest przypadkowe.\n\n" + text;
  }

  return text;
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
function injectCoreMeaning(text: string, userText: string) {
  const t = userText.toLowerCase();

  if (/czemu ludzie/.test(t)) {
    return (
      "Bo większość ludzi działa z napięcia, nie ze spokoju.\n\n" +
      text
    );
  }

  if (/mam dość|wkurwiają/.test(t)) {
    return (
      "To nie są tylko oni — to też to, że masz już tego za dużo.\n\n" +
      text
    );
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
    return text
      .split(".")
      .slice(0, 2)
      .join(".") + ".";
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
function injectCharacter(text: string, mode?: string, userType?: string) {
  if (mode === "deep") return text;

  // 🔹 lekkie „rozluźnienie języka”
  text = text
    .replace(/to jest/g, "to jest trochę")
    .replace(/wydaje się/g, "trochę wygląda");

  // 🔹 dopasowanie do typu usera
  if (userType === "chaotic" && Math.random() < 0.3) {
    return text + "\n\nTrochę odklejone, ale działa.";
  }

  if (userType === "direct" && text.length > 120) {
    return text.split(".").slice(0, 2).join(".") + ".";
  }

  // 🔹 neutralny vibe
  if (Math.random() < 0.3) {
    const adds = [
      "I to jest ciekawe.",
      "Coś tu się powtarza.",
      "Nie wygląda to przypadkowo.",
      "Jest w tym jakiś schemat.",
    ];

    const pick = adds[Math.floor(Math.random() * adds.length)];

    return `${text}\n\n${pick}`;
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

  // 🟢 HIGH → zostaw
  return text;
}
// 🔥 MAIN
export function shapeResponse({
  text,
  intent,
  userText = "",
  mode = "casual",
  microDetail,
  userStyle,
  userType,
  topics,
  patterns,
  prediction,
  decisionNudge,
  actions,
  progress,
  returnContext,
  isSensitive,
  score,
}: ShapeInput) {
  let output = text.trim();

  output = removeAiFluff(output);

  if (mode === "casual") {
    output = output
      .replace(/🔥[\s\S]*?👉/g, "")
      .replace(/⚠️[\s\S]*?\n/g, "")
      .replace(/👉[\s\S]*/g, "")
      .trim();
  }

  if (mode === "reflective") {
    output = output.replace(/👉[\s\S]*/g, "").trim();
  }

  // 🔥 FLOW (rdzeń rozmowy)
output = addHumanTouch(output, mode);
output = injectDeeperResponse(output, userText);
output = addMemoryEcho(output, microDetail);
output = softenTone(output);
output = adaptLength(output, userText);
output = adaptToUserStyle(output, userStyle);

// 🔥 INTELIGENCJA (LOSOWANA — max 1–2 rzeczy)
const rand = Math.random();

if (rand < 0.25) {
  output = addTopicCallback(output, topics);
} else if (rand < 0.45) {
  output = addPatternReflection(output, patterns);
} else if (rand < 0.6) {
  output = addPrediction(output, prediction);
} else if (rand < 0.75) {
  output = addDecisionNudge(output, decisionNudge);
} else if (rand < 0.9) {
  output = addActionCheck(output, actions);
} else if (rand < 1) {
  output = addProgressSignal(output, progress);
}
// 🔥 CLEAN
output = removeRepetitions(output);

// 🔥 CHARAKTER 
output = injectCharacter(output, mode, userType);

// 🔥 MIKRO KONFLIKT 
output = addMicroConflict(output, userText, userType, isSensitive);

output = applyAutoTuning(output, score);
output = addMicroConflict(output, userText, userType, isSensitive);

// 🔥 1 efekt specjalny
const effectRand = Math.random();

if (effectRand < 0.35) {
  output = addReturnHook(output, returnContext);
} else if (effectRand < 0.55) {
  output = addHook(output, mode);
} else if (effectRand < 0.7) {
  output = addLooseEnding(output, mode);
}

return output.trim();
 
}