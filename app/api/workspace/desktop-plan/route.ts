import OpenAI from "openai";
import { NextResponse } from "next/server";
import { isPrivateWorkspace, workspaceMessages } from "@/lib/workspace";
import { DESKTOP_PLAN_PROMPT, desktopPlan, tableContext } from "@/lib/desktop-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isPrivateWorkspace()) return NextResponse.json({ error: "WORKSPACE_DISABLED" }, { status: 403 });
  let messages, current;
  try {
    const text = await req.text();
    if (text.length > 128 * 1024) throw new Error("TOO_LARGE");
    const body = JSON.parse(text);
    messages = workspaceMessages(body);
    current = tableContext(body.currentTable);
  } catch {
    return NextResponse.json({ message: "Nieprawidłowe polecenie lub stan tabeli." }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ message: "Brakuje konfiguracji modelu." }, { status: 503 });
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000, maxRetries: 1 });
    const response = await client.chat.completions.create({
      model: process.env.NAVIMIND_WORKSPACE_MODEL || "gpt-4.1-mini",
      messages: [
        { role: "system", content: DESKTOP_PLAN_PROMPT },
        { role: "system", content: "AKTYWNA TABELA: " + JSON.stringify(current) },
        ...messages,
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 3000,
    });
    const plan = desktopPlan(JSON.parse(response.choices[0]?.message.content || ""), current);
    return NextResponse.json(plan);
  } catch {
    console.error("WORKSPACE_DESKTOP_PLAN_FAILED");
    return NextResponse.json({ message: "Nie udało się przygotować poprawnego zadania. Niczego nie wykonano; doprecyzuj polecenie." }, { status: 503 });
  }
}
