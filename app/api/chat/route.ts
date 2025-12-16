import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Brak OPENAI_API_KEY");
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return Response.json({
      text: response.output_text,
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);
    return Response.json(
      { text: "Błąd serwera (API chat)." },
      { status: 500 }
    );
  }
}