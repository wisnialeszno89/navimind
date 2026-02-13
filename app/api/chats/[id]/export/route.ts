import { NextResponse } from "next/server";
import { getSessionEmail } from "../../../../lib/auth/session";
import { getUserPlan } from "../../../../lib/userPlan";
import { getChatMessagesByEmail } from "../../../../lib/chatHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatChatToText(messages: { role: string; content: string }[]) {
  return messages
    .map((m) => {
      const role =
        m.role === "user"
          ? "USER"
          : m.role === "assistant"
          ? "NAVIMIND"
          : "SYSTEM";

      return `=== ${role} ===\n${m.content}\n`;
    })
    .join("\n");
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const email = getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const plan = await getUserPlan();
  if (plan !== "pro_plus") {
    return NextResponse.json(
      {
        error: "PROPLUS_REQUIRED",
        message: "Eksport rozmowy do PDF jest dostępny w PRO+.",
      },
      { status: 403 }
    );
  }

  const chatId = params.id;
  if (!chatId) {
    return NextResponse.json({ error: "NO_CHAT_ID" }, { status: 400 });
  }

  const messages = await getChatMessagesByEmail(email, chatId);

  if (!messages || messages.length === 0) {
    return NextResponse.json(
      { error: "EMPTY_CHAT", message: "Ta rozmowa jest pusta." },
      { status: 400 }
    );
  }

  const content = formatChatToText(
    messages.map((m) => ({ role: m.role, content: m.content }))
  );

  const safeTitle = `NaviMind — chat ${chatId.slice(0, 8)}`;

  return NextResponse.json({
    title: safeTitle,
    content,
  });
}