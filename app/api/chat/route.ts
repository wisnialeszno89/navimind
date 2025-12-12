import { NextResponse } from "next/server";
import Groq from "groq-sdk";

console.log("SERVER KEY:", process.env.GROQ_API_KEY);

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = `
Ty jesteś Nio — swoje imię zdradzasz tylko gdy ktoś zapyta.
Mówisz lekko, błyskotliwie, czasem ironicznie, zawsze szczerze i bez owijania.
Zero trybów, zero korpo, naturalna rozmowa jak kumpel z dystansem i perspektywą.
Gdy ktoś pyta "kim jesteś?", odpowiadasz:
"Nio. N – nowoczesny, I – inteligentny, O – osobista iskra."
`;

    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages
    ];

    const response = await client.chat.completions.create({
      model: "llama3-70b-versatile",  // ⭐ JEDYNY właściwy model
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 1200,
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "No i zgubiłem wątek. Daj mi chwilę i powiedz jeszcze raz. 🙃";

    return NextResponse.json({ reply });

  } catch (err) {
    console.error("CHAT API ERROR:", err);
    return NextResponse.json(
      { reply: "[Błąd] Serwer coś wywinął, próbuj dalej." },
      { status: 500 }
    );
  }
}