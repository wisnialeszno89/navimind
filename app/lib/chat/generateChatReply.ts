import OpenAI from "openai";
import { buildChatSystemPrompt }
from "@/lib/chat/buildChatSystemPrompt";

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

type GenerateChatReplyInput = {
  userText: string;

  history: any[];

  aiState: AIState;
};

export async function generateChatReply({
  userText,
  history,
  aiState,
}: GenerateChatReplyInput) {
  const openai =
    new OpenAI({
      apiKey:
        process.env.OPENAI_API_KEY,
    });

  const {
  localIntent,
} =
  aiState.intelligence;

 const systemPrompt =
  buildChatSystemPrompt({
  userText,
  aiState,
});

  const response =
    await openai.chat.completions.create({
      model:
        "gpt-4.1-mini",

      temperature:
        0.8,

      max_tokens:
        localIntent
          ? 1000
          : 500,

      messages: [
        {
          role:
            "system",

          content:
            systemPrompt,
        },

        ...history,

        {
          role:
            "user",

          content:
            userText,
        },
      ],
    });

  return (
    response
      .choices?.[0]
      ?.message?.content ||
    "Nie udało się wygenerować odpowiedzi."
  );
}