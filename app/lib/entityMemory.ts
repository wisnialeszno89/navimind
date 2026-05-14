import type { ConversationState } from "./conversationState";

export function updateResolvedEntities(
  state: ConversationState,
  text: string
) {
  const t = text.toLowerCase();

  const entities = [
    {
      trigger: "wielka sowa",
      type: "mountain",
    },
    {
      trigger: "nextjs",
      type: "framework",
    },
    {
      trigger: "vercel",
      type: "platform",
    },
    {
      trigger: "kamper",
      type: "vehicle",
    },
  ];

  for (const entity of entities) {
    if (t.includes(entity.trigger)) {
      state.resolvedEntities[
        entity.trigger
      ] = {
        type: entity.type,
        confidence: 0.95,
      };

      state.activeEntities = [
        ...new Set([
          ...state.activeEntities,
          entity.trigger,
        ]),
      ];
    }
  }

  return state;
}

export function buildEntityContext(
  state: ConversationState
) {
  const entities =
    Object.entries(
      state.resolvedEntities
    );

  if (!entities.length) {
    return "";
  }

  return `
KNOWN ENTITIES:

${entities
  .map(
    ([name, value]) =>
      `- ${name} (${value.type})`
  )
  .join("\n")}
`;
}