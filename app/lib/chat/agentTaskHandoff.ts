/**
 * Explicit, human-approved handoff from conversation into a portable task.
 *
 * The browser never executes an action or forwards this task to a desktop.
 * Only the locally operated WindowHub agent can attempt it later.
 */
import { randomUUID } from "node:crypto";

export type ChatInteractionMode = "conversation" | "task";

export type AgentTaskHandoff = {
  schema_version: "1";
  id: string;
  goal: string;
  target: "windowhub" | "computer";
  status: "prepared_not_executed";
  execution: "local_user_approval_required";
  format: "plain_text_v1";
};

const WINDOW_TERMS = /(?:^|[^\p{L}])(?:okn[\p{L}]*|okien[\p{L}]*|stolark[\p{L}]*|windowhub)(?=$|[^\p{L}])/iu;
const OFFER_TERMS = /(?:^|[^\p{L}])(?:ofert[\p{L}]*|wyce[nń][\p{L}]*|zamów[\p{L}]*|zlec[\p{L}]*|kalkulac[\p{L}]*)(?=$|[^\p{L}])/iu;
const COMMAND_TERMS = /(?:^|[^\p{L}])(?:przygotuj|utwórz|stwórz|zrób|wyceń|wygeneruj|wprowadź|dodaj|potrzebuję|chcę|poproszę|wykonaj|zbuduj)(?=$|[^\p{L}])/iu;
const QUESTIONS = /(?:^|[^\p{L}])(?:jak|dlaczego|czym|co to|wytłumacz|wyjaśnij|porównaj)(?=$|[^\p{L}])/iu;

function isWindowOfferRequest(text: string): boolean {
  return WINDOW_TERMS.test(text) && OFFER_TERMS.test(text)
    && COMMAND_TERMS.test(text) && !QUESTIONS.test(text);
}

export function isTaskMode(value: unknown): value is ChatInteractionMode {
  return value === "conversation" || value === "task";
}

export function prepareAgentTaskHandoff(
  userText: string,
  interactionMode: ChatInteractionMode,
): AgentTaskHandoff | null {
  const goal = userText.trim();
  if (goal.length < 4 || goal.length > 4_000) return null;
  if (interactionMode !== "task" && !isWindowOfferRequest(goal)) return null;

  return {
    schema_version: "1",
    id: randomUUID(),
    goal,
    target: WINDOW_TERMS.test(goal) && OFFER_TERMS.test(goal)
      ? "windowhub" : "computer",
    status: "prepared_not_executed",
    execution: "local_user_approval_required",
    format: "plain_text_v1",
  };
}
