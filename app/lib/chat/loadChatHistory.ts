import { getDemoMemory } from "@/lib/demoMemory";

import { getChatMessagesByEmail } from "@/lib/chatHistory";

type ChatRole =
  | "user"
  | "assistant"
  | "system";

export type ChatMsg = {
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

type LoadChatHistoryInput = {
  plan: string;
  userId: string;
  email: string | null;
  chatId?: string;
};

export async function loadChatHistory({
  plan,
  userId,
  email,
  chatId,
}: LoadChatHistoryInput) {
  let history:
    ChatMsg[] = [];

  if (plan === "free") {
    history =
      await getDemoMemory(
        userId
      );
  } else if (
    email &&
    chatId
  ) {
    const kvMsgs =
      await getChatMessagesByEmail(
        email,
        chatId
      );

    history =
      kvMsgs
        ?.map((m) => ({
          role: m.role,
          content:
            String(
              m.content
            ),
        }))
        .filter(
          (
            m
          ): m is ChatMsg =>
            isRole(
              m.role
            )
        )
        .slice(-20) || [];
  }

  return history;
}