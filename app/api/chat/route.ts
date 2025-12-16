import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ text: "Brak wiadomości." }),
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text =
      completion.choices[0]?.message?.content ??
      "…";

    return new Response(
      JSON.stringify({ text }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("CHAT API ERROR:", err);

    return new Response(
      JSON.stringify({ text: "Błąd serwera." }),
      { status: 500 }
    );
  }
}