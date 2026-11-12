import OpenAI from "openai";
import { NextResponse } from "next/server";
import { isPrivateWorkspace, workspaceMessages, lemonAccountHelp, paymentExecutionHelp } from "@/lib/workspace";
import { DESKTOP_PLAN_PROMPT, desktopPlan, tableContext, tableCatalog, desktopCapabilities, reportCatalog, unresolvedDimensionQuestion } from "@/lib/desktop-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isPrivateWorkspace()) return NextResponse.json({ error: "WORKSPACE_DISABLED" }, { status: 403 });
  let messages, current, tables, capabilities, reports;
  try {
    const text = await req.text();
    if (text.length > 640 * 1024) throw new Error("TOO_LARGE");
    const body = JSON.parse(text);
    messages = workspaceMessages(body, 48000);
    current = tableContext(body.currentTable);
    tables = tableCatalog(body.tables);
    reports = reportCatalog(body.reports);
    capabilities = desktopCapabilities(body.capabilities);
  } catch {
    return NextResponse.json({ message: "Nieprawidłowe polecenie lub stan tabeli." }, { status: 400 });
  }
  const help = paymentExecutionHelp(messages) || lemonAccountHelp(messages[messages.length-1].content);
  if(help)return NextResponse.json({decision: "respond", task: null, reply: help, expectedRevision: null});
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ message: "Brakuje konfiguracji modelu." }, { status: 503 });
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 22000, maxRetries: 0 });
    const conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {role: "system", content: DESKTOP_PLAN_PROMPT},
      {role: "system", content: "AKTYWNA TABELA: " + JSON.stringify(current) + "\nKATALOG PLIKÓW: " + JSON.stringify(tables) + "\nISTNIEJĄCE RAPORTY: " + JSON.stringify(reports) + "\nDOSTĘPNE: " + JSON.stringify(capabilities)},
      ...messages,
    ];
    // A malformed tool proposal is our formatting problem, not a reason to ask the user for JSON.
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.chat.completions.create({
        model: process.env.NAVIMIND_WORKSPACE_MODEL || "gpt-4.1-mini",
        messages: conversation, response_format: {type: "json_object"}, temperature: 0, max_tokens: capabilities.includes("save_offer_specification") ? 14000 : 6000,
      });
      const content = response.choices[0]?.message.content || "";
      try {
        const plan = desktopPlan(JSON.parse(content), current, capabilities, tables, reports);
        const latest = messages[messages.length-1];
        const specificationIntent = /^(?:tak|ok|okej|wykonaj|zrób|proszę|prosze|kontynuuj)\b|j\.?\s*w\.?/iu.test(latest.content) ? messages.filter(item=>item.role==='user').slice(-5) : [latest];
        const fullSpecification = specificationIntent.some(item=>/pełn\p{L}*\s+(?:specyfikac|wyposaż)|zapis\p{L}*.{0,100}specyfikac/iu.test(item.content));
        if(fullSpecification && plan.task?.kind==='create_window_table')throw Error('FULL_SPECIFICATION_REQUIRES_DOCUMENT_NOT_TABLE');
        const question = unresolvedDimensionQuestion(latest.content, messages.slice(0,-1), plan.task);
        if(question)return NextResponse.json({decision: "clarify", task: null, reply: question, expectedRevision: null});
        return NextResponse.json(plan);
      } catch (problem) {
        if (attempt === 1) throw problem;
        const category = problem instanceof SyntaxError ? "INVALID_JSON" : problem instanceof Error ? problem.message : "INVALID_PLAN";
        conversation.push({role: "assistant", content});
        conversation.push({role: "system", content: "Sprawdzenie propozycji wykryło " + category + ". Niczego nie wykonano. Popraw format lub wybór narzędzia zgodnie z DOSTĘPNE i KATALOGIEM. Jeśli brakuje danych użytkownika, zwróć decision:clarify i jedno konkretne pytanie; task:null. Nie wymyślaj brakujących danych i nie proś użytkownika o JSON."});
      }
    }
    throw new Error("NO_VALID_PLAN");
  } catch {
    console.error("WORKSPACE_DESKTOP_PLAN_FAILED");
    return NextResponse.json({ message: "Nie udało się teraz przygotować zadania. Niczego nie wykonano. Spróbuj ponownie; nie musisz używać specjalnej składni." }, { status: 503 });
  }
}
