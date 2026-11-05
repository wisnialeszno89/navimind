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

const WINDOW_TERMS = /\b(?:okn(?:o|a|em|ie|ami|ach)?|okien|stolark\w*|windowhub)\b/i;
const OFFER_TERMS = /\b(?:ofert\w*|wycen\w*|zamów\w*|zlec\w*|kalkulac\w*)\b/i;
const COMMAND_TERMS = /\b(?:przygotuj|utwórz|stwórz|zrób|wyceń|wygeneruj|wprowadź|dodaj|potrzebuję|chcę|poproszę|wykonaj|zbuduj)\b/i;
const QUESTIONS = /\b(?:jak|dlaczego|czym|co to|wytłumacz|wyjaśnij|porównaj)\b/i;

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
