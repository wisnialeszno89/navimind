import OpenAI from "openai";
import { systemPrompt } from "@/lib/systemPrompt";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_HISTORY = 20;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages)) {
      throw new Error("messages is not an array");
    }

    // 🔒 tylko user + assistant
    let history = messages
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-MAX_HISTORY);

    // 🔒 NIE pozwalamy zaczynać od assistant
    if (history[0]?.role === "assistant") {
      history.shift();
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.7,
    });

    const text =
      completion.choices[0]?.message?.content?.trim() ||
      "Chwila ciszy. Spróbuj jeszcze raz.";

    return Response.json({ text });
  } catch (error) {
    console.error("CHAT API ERROR FULL:", error);

    return Response.json(
      { text: "Coś się wysypało po stronie serwera." },
      { status: 500 }
    );
  }
}