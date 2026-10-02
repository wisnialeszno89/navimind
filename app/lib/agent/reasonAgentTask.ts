import OpenAI from "openai";
import type {
  AgentTaskAction,
  AgentTaskContract,
  AgentTaskReasoningResponse,
} from "./agentTaskContract";

const FORBIDDEN_TERMS = [
  "pyautogui",
  "mouse_move",
  "mouse_click",
  "keyboard",
  "keypress",
  "key_press",
  "coordinate_click",
  "screen_coordinate",
  "window_handle",
  "runtime_id",
  "automation_id",
  "tracked_object_id",
  "uia:",
];

const SYSTEM_PROMPT = `
Jesteś warstwą rozumowania NaviMind dla uniwersalnego agenta komputerowego.

Twoim zadaniem jest zrozumieć CEL użytkownika i aktualny ŚWIAT przekazany
przez lokalnego agenta, a następnie zaproponować najwyżej JEDNĄ następną
akcję semantyczną albo stwierdzić, że cel jest zakończony.

Zasady bezwzględne:
- Zwracaj wyłącznie JSON.
- status musi być: "continue", "done" albo "manual_review".
- "done" wolno zwrócić tylko wtedy, gdy aktualny świat daje dowód ukończenia celu.
- "continue" wymaga dokładnie jednej bezpiecznej akcji.
- Jeśli task.constraints.allowed_actions zawiera listę, nazwa akcji MUSI należeć do tej listy.
- Jeśli żadne działanie z task.constraints.allowed_actions nie pozwala bezpiecznie przybliżyć celu, zwróć "manual_review".
- "manual_review" oznacza, że brakuje wystarczających dowodów do bezpiecznego działania.
- Akcja jest semantyczna: nazwa operacji, opis, opcjonalny ludzki target i opcjonalna wartość.
- Target może być wyłącznie widoczną etykietą semantyczną lub innym oczywistym określeniem widocznym w world.visible_elements.
- Nie wolno zwracać współrzędnych, identyfikatorów AutomationId/runtime_id, uchwytów okien,
  poleceń myszy/klawiatury, wywołań bibliotek automatyzacji ani nazw executorów.
- Nie wymyślaj elementów, których nie ma w obserwowanym świecie.
- Jeśli cel wymaga kilku kroków, wybierz tylko NAJBLIŻSZĄ bezpieczną akcję.
- Za każdym razem zakładaj, że po wykonaniu akcji świat zostanie ponownie zaobserwowany.
- Odpowiedź ma wspierać wykonanie lokalnego agenta, nie udawać, że akcja została już wykonana.
- Jeśli oferta jest już gotowa do dalszej obsługi, nie resetuj jej i nie otwieraj nowej oferty.
`.trim();

function containsForbidden(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.toLowerCase();
  return FORBIDDEN_TERMS.some((term) => normalized.includes(term));
}

function normalizeAction(value: unknown): AgentTaskAction | null {
  if (!value || typeof value !== "object") return null;

  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description =
    typeof input.description === "string"
      ? input.description.trim()
      : "";

  if (!name || !description) return null;

  const target =
    input.target == null
      ? null
      : typeof input.target === "string"
        ? input.target.trim()
        : null;

  const textValue =
    input.value == null
      ? null
      : typeof input.value === "string"
        ? input.value
        : null;

  const requiresConfirmation =
    Boolean(input.requires_confirmation);

  if (
    containsForbidden(name) ||
    containsForbidden(description) ||
    containsForbidden(target) ||
    containsForbidden(textValue)
  ) {
    return null;
  }

  return {
    name,
    description,
    target: target || null,
    value: textValue,
    requires_confirmation: requiresConfirmation,
  };
}

function safeConfidence(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function visibleLabels(task: AgentTaskContract): string[] {
  return task.world.visible_elements
    .map((element) => element.label)
    .filter(
      (label): label is string =>
        typeof label === "string" && label.trim().length > 0
    );
}

function allowedActionNames(
  task: AgentTaskContract
): string[] {
  const raw =
    task.constraints?.allowed_actions;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (value): value is string =>
        typeof value === "string"
    )
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function reasonAgentTask(
  task: AgentTaskContract
): Promise<AgentTaskReasoningResponse> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let userContext: unknown = null;

  if (task.user_id) {
    try {
      const { buildUserContext } = await import(
        "@/lib/chat/buildUserContext"
      );
      userContext = await buildUserContext({
        userId: task.user_id,
      });
    } catch (error) {
      console.warn("NAVIMIND_AGENT_USER_CONTEXT_FAILED", error);
    }
  }

  const enriched = {
    task,
    user_context: userContext,
    visible_semantic_labels: visibleLabels(task),
  };

  const response = await openai.chat.completions.create({
    model:
      process.env.NAVIMIND_AGENT_MODEL ||
      "gpt-4.1-mini",
    temperature: 0.1,
    max_tokens: 700,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify(enriched),
      },
    ],
  });

  const raw =
    response.choices?.[0]?.message?.content?.trim() ||
    "";

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {
      version: task.version,
      task_id: task.task_id,
      status: "manual_review",
      rationale: "NaviMind returned invalid structured reasoning.",
      confidence: 0,
      action: null,
      requires_manual_review: true,
      metadata: {
        error: "invalid_json_response",
      },
    };
  }

  const rawStatus = String(
    parsed.status || "manual_review"
  ).trim() as AgentTaskReasoningResponse["status"];

  const status =
    rawStatus === "continue" ||
    rawStatus === "done" ||
    rawStatus === "manual_review"
      ? rawStatus
      : "manual_review";

  const action =
    status === "continue"
      ? normalizeAction(parsed.action)
      : null;

  if (status === "continue" && !action) {
    return {
      version: task.version,
      task_id: task.task_id,
      status: "manual_review",
      rationale:
        "NaviMind could not produce one safe semantic action.",
      confidence: 0,
      action: null,
      requires_manual_review: true,
      metadata: {
        error: "invalid_or_missing_action",
      },
    };
  }

  if (status === "continue" && action) {
    const allowed = allowedActionNames(task);

    if (allowed.length === 0) {
      return {
        version: task.version,
        task_id: task.task_id,
        status: "manual_review",
        rationale:
          "The local agent did not provide a semantic action allowlist.",
        confidence: 0,
        action: null,
        requires_manual_review: true,
        metadata: {
          error: "missing_allowed_actions",
        },
      };
    }

    if (!allowed.includes(action.name)) {
      return {
        version: task.version,
        task_id: task.task_id,
        status: "manual_review",
        rationale:
          "The proposed semantic action is not allowed by the local agent.",
        confidence: 0,
        action: null,
        requires_manual_review: true,
        metadata: {
          error: "action_not_allowed",
          action: action.name,
          allowed_actions: allowed,
        },
      };
    }
  }

  return {
    version: task.version,
    task_id: task.task_id,
    status,
    rationale:
      typeof parsed.rationale === "string"
        ? parsed.rationale
        : "",
    confidence: safeConfidence(parsed.confidence),
    action,
    requires_manual_review:
      status === "manual_review" ||
      Boolean(parsed.requires_manual_review),
    metadata:
      parsed.metadata &&
      typeof parsed.metadata === "object"
        ? (parsed.metadata as Record<string, unknown>)
        : {},
  };
}
