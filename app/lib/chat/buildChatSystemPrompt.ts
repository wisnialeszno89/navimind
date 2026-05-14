import { buildSystemPrompt }
from "@/lib/conversation/buildSystemPrompt";

import { detectConversationMode }
from "@/lib/conversation/detectConversationMode";

import { detectResponseStrategy }
from "@/lib/conversation/detectResponseStrategy";

import { buildGuidanceLayer }
from "./buildGuidanceLayer";

import type {
  AIState,
} from "./chatTypes";

import type {
  IntelligenceState,
  RuntimeContext,
  UserContext,
  ContinuityState,
  InternalState,
} from "./chatTypes";

type BuildChatSystemPromptInput = {
  userText: string;

  aiState: AIState;
};

export function buildChatSystemPrompt({
  userText,
  aiState,
}: BuildChatSystemPromptInput) {
  const {
  intelligence,
  runtimeContext,
  userContext,
  continuity,
  internalState,
  topicAnchors,
} = aiState;
 const {
  analysis,
  intent,
  localIntent,
  violenceRisk,
} = intelligence;
  const {
    summary,
    entityContext,
  } = runtimeContext;
  
  const {
  emotionalProfile,
} = userContext;

const {
  activeTopic,
} = userContext;
const topicContext =
  activeTopic
    ? `
ACTIVE LONG-TERM TOPIC:
${activeTopic}

This is likely the user's
main recurring life theme.

Keep continuity naturally.
`
    : "";
    const guidanceLayer =
  buildGuidanceLayer({
    intelligence,
    userContext,
  });
  const internalStateContext =
  internalState
    ? `
INTERNAL CONVERSATION STATE:

${JSON.stringify(
  internalState,
  null,
  2
)}

Adapt response style naturally
to this state.
`
    : "";
const emotionalContext =
  emotionalProfile
    ? `
EMOTIONAL PROFILE:

${JSON.stringify(
  emotionalProfile,
  null,
  2
)}

Use this only as subtle
background context.

Do not mention psychological
labels directly.
`
    : "";
  const continuityContext =
  continuity.isContinuation
    ? `
CONTINUATION:
This message is part of an ongoing conversation.

Do not reset the topic.
Do not ask again for context.
Continue naturally.
`
    : "";
  const mode =
    detectConversationMode(
      userText
    );

  const strategy =
    detectResponseStrategy({
      userText,
      mode,
    });

  return buildSystemPrompt({
    mode,
    strategy,

    memory: {
      analysis,
      summary,
      entityContext,
    },

    contextBlock: `
INTENT:
${intent}

LOCAL_INTENT:
${localIntent}

VIOLENCE_RISK:
${violenceRisk}

SUMMARY:
${summary}

ENTITY_CONTEXT:
${entityContext}

${emotionalContext}

${continuityContext}

${topicContext}

GUIDANCE:
${guidanceLayer}

${internalStateContext}

TOPIC ANCHORS:
${topicAnchors.join(", ")}

These are the active
semantic anchors of the conversation.

If the user uses:
- shortened references
- partial names
- vague followups

assume they refer to
these anchors unless the
user clearly changes topic.

Do not invent alternative
interpretations of anchor words.
`,
  });
}