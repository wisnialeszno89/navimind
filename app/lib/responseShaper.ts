type ShapeInput = {
  text: string;
  intent?: string;
  userText?: string;
  userStyle?: string;
  mode?: "casual" | "reflective" | "deep";
  microDetail?: string;
  topics?: string[];
  patterns?: string[];
  prediction?: string;
  decisionNudge?: string;
  actions?: string[];
  progress?: string;
  returnContext?: string;
  };

// 🔹 usuwa AI-fluff
function removeAiFluff(text: string) {
  return text.replace(
    /^(Rozumiem|Widzę|To brzmi|Dziękuję za podzielenie się|Masz rację|Czuję, że)[^.\n]*[.\n]+/i,
    ""
  );
}

// 🔹 lekki ludzki start
function addHumanTouch(text: string, mode?: string) {
  if (mode === "casual") return text;

  const starters = [
    "Wiesz co…",
    "Szczerze?",
    "Mam wrażenie, że…",
    "Trochę to wygląda jak…",
  ];

  const pick = starters[Math.floor(Math.random() * starters.length)];

  return `${pick}\n\n${text}`;
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
function adaptToUserStyle(text: string, style?: string) {
  if (!style) return text;

  if (style === "short") {
    return text.split(".")[0] + ".";
  }

  if (style === "direct") {
    return text
      .replace(/Wiesz co…\n\n/g, "")
      .replace(/Mam wrażenie, że…\n\n/g, "");
  }

  if (style === "emotional") {
    return "Czuję to.\n\n" + text;
  }

  if (style === "analytical") {
    return text + "\n\nTo ma swoją logikę.";
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

  if (Math.random() < 0.4) {
    const variants = {
      short: [
        "Widzę, że wracasz do tego.",
      ],
      medium: [
        "To chyba dalej siedzi w głowie.",
      ],
      long: [
        "Widzę, że wracasz do tego po dłuższym czasie.",
      ],
    };

    const pool = variants[returnContext as keyof typeof variants];
    if (!pool) return text;

    const pick = pool[Math.floor(Math.random() * pool.length)];

    return pick + "\n\n" + text;
  }

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
  topics,
  patterns,
  prediction,
  decisionNudge,
  actions,
  progress,
  returnContext
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

  // 🔥 FLOW
  output = addHumanTouch(output, mode);
  output = injectDeeperResponse(output, userText);
  output = addMemoryEcho(output, microDetail);
  output = softenTone(output);
  output = addSoftChallenge(output, userText);
  output = randomBreak(output);
  output = adaptLength(output, userText);
  output = adaptToUserStyle(output, userStyle);
  output = addTopicCallback(output, topics);
  output = addPatternReflection(output, patterns);
  output = injectCoreMeaning(output, userText);
  output = addPrediction(output, prediction);
  output = addDecisionNudge(output, decisionNudge);
  output = addActionCheck(output, actions);
  output = addProgressSignal(output, progress);
  if (Math.random() < 0.4) {
  output = addHook(output, mode);
  output = addReturnHook(output, returnContext);
}

if (Math.random() < 0.3) {
  output = addLooseEnding(output, mode);
}
  
  return output.trim();
  
}