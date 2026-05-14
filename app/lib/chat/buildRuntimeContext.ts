import { buildConversationState }
from "@/lib/conversationState";

import { buildConversationSummary }
from "@/lib/conversationSummary";

import { buildEntityContext }
from "@/lib/entityMemory";

import type {
  RuntimeContext,
} from "./chatTypes";

type Input = {
  userText: string;
  history: any[];
};

export function buildRuntimeContext({
  userText,
  history,
}: Input): RuntimeContext {
  const previousState =
    history
      .slice()
      .reverse()
      .find(
        (m: any) =>
          m.role ===
            "assistant" &&
          (
            m as any
          )
            .conversationState
      ) as any;

  const conversationState =
    buildConversationState(
      userText,
      history,
      previousState?.conversationState
    );

  const summary =
    buildConversationSummary(
      conversationState
    );

  const entityContext =
    buildEntityContext(
      conversationState
    );

  return {
    conversationState,
    summary,
    entityContext,
  };
}