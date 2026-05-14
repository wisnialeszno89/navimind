import type { ConversationState } from "./conversationState";

export function buildConversationSummary(
  state: ConversationState
) {
  return `
ACTIVE TOPIC:
${state.activeTopic}

ACTIVE INTENT:
${state.activeIntent}

ACTIVE ENTITIES:
${state.activeEntities.join(", ")}

USER GOAL:
${state.userGoal || "general"}
`;
}