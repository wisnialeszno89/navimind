import { getUserId } from "../../lib/userId";

import { getSessionEmail } from "../../lib/auth/session";

import { getUserPlan } from "../../lib/userPlan";

import { buildChatSystemPrompt }
from "@/lib/chat/buildChatSystemPrompt";

import { updateUserContext }
from "@/lib/chat/updateUserContext";
import { buildFollowupContext }
from "@/lib/chat/followup/buildFollowupContext";

import { buildIntelligence }
from "@/lib/chat/buildIntelligence";

import { buildUserContext }
from "@/lib/chat/buildUserContext";

import {
  getDemoMemory,
} from "../../lib/demoMemory";

import {
  getChatMessagesByEmail,
} from "../../lib/chatHistory";

import { checkAndIncrementLimit } from "../../lib/chatLimit";

import { buildRuntimeContext }
from "@/lib/chat/buildRuntimeContext";

import { detectConversationPhase, } from "../../lib/detectConversationPhase";


import { buildPromptContext } from "./buildPromptContext";

import { generateChatReply } from "@/lib/chat/generateChatReply";

import { detectFollowupState } from "@/lib/chat/detectFollowupState";

import { processResponse } from "@/lib/chat/processResponse";

import { loadChatHistory, } from "@/lib/chat/loadChatHistory";

import { runChatOrchestrator }
from "@/lib/chat/runChatOrchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========= TYPES ========= */

type ChatRole =
  | "user"
  | "assistant"
  | "system";

type ChatMsg = {
  role: ChatRole;
  content: string;
};
function isRole(
  role: any
): role is ChatRole {
  return (
    role === "user" ||
    role === "assistant" ||
    role === "system"
  );
}
/* ========= POST ========= */

export async function POST(
  req: Request
) {
  try {
    /* ========= BODY ========= */

    const body =
      await req
        .json()
        .catch(() => null);

    const userText =
      String(
        body?.message || ""
      ).trim();

    if (!userText) {
      return new Response(
        JSON.stringify({
          error:
            "NO_MESSAGE",
        }),
        {
          status: 400,
        }
      );
    }
    

    /* ========= USER ========= */

    const userId =
      getUserId();

    if (!userId) {
      return new Response(
        JSON.stringify({
          error:
            "UNAUTHORIZED",
        }),
        {
          status: 401,
        }
      );
    }

    const email =
      getSessionEmail();

    const plan =
      await getUserPlan();

    /* ========= LIMIT ========= */

    if (plan === "free") {
      const limit =
        await checkAndIncrementLimit(
          userId
        );

      if (!limit.allowed) {
        return new Response(
          JSON.stringify({
            error:
              "LIMIT_REACHED",

            used:
              limit.used,

            limit:
              limit.limit,

            resetAt:
              limit.resetAt,
          }),
          {
            status: 403,
          }
        );
      }
    }
    /* ========= HISTORY ========= */

const history =
  await loadChatHistory({
    plan,
    userId,
    email,
    chatId:
      body?.chatId,
  });

/* ========= ANALYSIS ========= */

const {
  finalOutput,
  } =
  await runChatOrchestrator({
    userId,
    userText,
    history,
  });
/* ========= RESPONSE ========= */

return new Response(
  JSON.stringify({
    reply:
      finalOutput,
  }),
  {
    headers: {
      "Content-Type":
        "application/json",
    },
  }
);

} catch (error) {
  console.error(
    "CHAT API ERROR",
    error
  );

  return new Response(
    JSON.stringify({
      error:
        "INTERNAL_ERROR",
    }),
    {
      status: 500,
    }
  );
}
}