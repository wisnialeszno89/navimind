import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { default: OpenAI } = await import("openai");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const lang = (formData.get("lang") as string) || "pl";

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      language: lang === "pl" ? "pl" : "en",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
