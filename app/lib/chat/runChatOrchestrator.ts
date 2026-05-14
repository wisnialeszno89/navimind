import { buildIntelligence }
from "@/lib/chat/buildIntelligence";

import { buildRuntimeContext }
from "@/lib/chat/buildRuntimeContext";

import { buildUserContext }
from "@/lib/chat/buildUserContext";

import { updateUserContext }
from "@/lib/chat/updateUserContext";

import { generateChatReply }
from "@/lib/chat/generateChatReply";

import { processResponse }
from "@/lib/chat/processResponse";

import { detectConversationContinuity }
from "@/lib/chat/detectConversationContinuity";

import { buildInternalState }
from "@/lib/chat/buildInternalState";

import type {
  IntelligenceState,
  RuntimeContext,
  UserContext,
  ContinuityState,
  InternalState,
} from "./chatTypes";

import { buildAIState }
from "./buildAIState";

import { buildTopicAnchor }
from "./buildTopicAnchor";

type Input = {
  userId: string;
  userText: string;
  history: any[];
};

export async function runChatOrchestrator({
  userId,
  userText,
  history,
}: Input) {
  const historyTexts =
    history.map(
      (m) => m.content
    );

  const intelligence:
  IntelligenceState =
    buildIntelligence({
      userText,
    });

  const runtimeContext:
  RuntimeContext =
    buildRuntimeContext({
      userText,
      history,
    });

  const userContext:
  UserContext =
    await buildUserContext({
      userId,
    });

  await updateUserContext({
    userId,
    userText,
    historyTexts,
    analysis:
      intelligence.analysis,
  });

  const continuity:
  ContinuityState =
  detectConversationContinuity({
    userText,
    history,
  });
  const internalState:
  InternalState =
  buildInternalState({
    userText,
    history,
    intelligence,
  });
  const topicAnchors =
  buildTopicAnchor({
    userText,
    history,
  });
  const aiState =
  buildAIState({
    intelligence,
    runtimeContext,
    userContext,
    continuity,
    internalState,
    topicAnchors,
  });

  const aiText =
    await generateChatReply({
  userText,
  history,
  aiState,
})

  const processed =
    processResponse({
      aiText,
    });

  return {
    aiText,
    finalOutput:
      processed.finalOutput,

    intelligence,
    runtimeContext,
    userContext,
  };
}