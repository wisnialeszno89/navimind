import OpenAI from "openai";
import { NextResponse } from "next/server";
import { isPrivateWorkspace, workspaceMessages, WORKSPACE_PROMPT } from "@/lib/workspace";

import { readWorkspaceBody, workspaceImage } from "@/lib/workspace-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isPrivateWorkspace()) return NextResponse.json({ error: "WORKSPACE_DISABLED" }, { status: 403 });
  let messages, screenshot;
  try {
    const body = await readWorkspaceBody(req);
    messages = workspaceMessages(body);
    screenshot = workspaceImage(body.image);
  } catch (problem) {
    const large = problem instanceof Error && problem.message === "REQUEST_TOO_LARGE";
    return NextResponse.json({ error: large ? "REQUEST_TOO_LARGE" : "INVALID_MESSAGE", message: large ? "Wiadomość jest za duża. Zrzut może mieć do 2 MB." : "Sprawdź wiadomość i zrzut ekranu. Obsługiwane formaty: PNG, JPG, WebP, do 2 MB." }, { status: large ? 413 : 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "MODEL_NOT_CONFIGURED", message: "Brakuje konfiguracji modelu na serwerze." }, { status: 503 });
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000, maxRetries: 1 });
    const conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: "system", content: WORKSPACE_PROMPT }, ...messages];
    if (screenshot) {
      const last = messages[messages.length-1];
      conversation[conversation.length-1] = {role: "user", content: [
        {type: "text", text: last.content},
        {type: "image_url", image_url: {url: screenshot, detail: "auto"}},
      ]};
    }
    const response = await client.chat.completions.create({
      model: process.env.NAVIMIND_WORKSPACE_MODEL || "gpt-4.1-mini",
      messages: conversation,
      temperature: 0.3,
      max_tokens: 1200,
    });
    const reply = response.choices[0]?.message.content?.trim();
    if (!reply) throw new Error("EMPTY_REPLY");
    return NextResponse.json({ reply, agentConnected: false });
  } catch (error) {
    const status = error instanceof OpenAI.APIError ? error.status : undefined;
    console.error("WORKSPACE_CHAT_FAILED", { status, name: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({
      error: "MODEL_UNAVAILABLE",
      message: status === 401 ? "Serwer wymaga aktualizacji klucza modelu." :
        status === 429 ? "Dostawca modelu zgłosił limit. Sprawdź saldo lub limit konta API." :
        "Model chwilowo nie odpowiada. Spróbuj ponownie.",
    }, { status: 503 });
  }
}
