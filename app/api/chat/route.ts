import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const input = messages.map((m: any) => ({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    }));

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input,
    });

    return new Response(
      JSON.stringify({ text: response.output_text }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ text: "Błąd serwera" }),
      { status: 500 }
    );
  }
}