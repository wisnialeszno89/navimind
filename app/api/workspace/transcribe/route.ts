import OpenAI from "openai";
import { NextResponse } from "next/server";
import { isPrivateWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const MAX_AUDIO = 4 * 1024 * 1024;

export async function POST(req: Request) {
  if (!isPrivateWorkspace()) return NextResponse.json({ error: "WORKSPACE_DISABLED" }, { status: 403 });
  if (Number(req.headers.get("content-length") || 0) > MAX_AUDIO) {
    return NextResponse.json({ message: "Nagranie jest za duże. Nagraj krótsze polecenie." }, { status: 413 });
  }
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_AUDIO ||
        !/^(audio\/(webm|mp4|wav|mpeg)|video\/webm)(;|$)/i.test(file.type)) {
      return NextResponse.json({ message: "Nieprawidłowy format lub rozmiar nagrania." }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ message: "Brakuje konfiguracji rozpoznawania mowy na serwerze." }, { status: 503 });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000, maxRetries: 1 });
    const result = await client.audio.transcriptions.create({
      file,
      model: process.env.NAVIMIND_TRANSCRIPTION_MODEL || "gpt-transcribe",
      language: form.get("language") === "en" ? "en" : "pl",
      prompt: "NaviMind, WindowHub, ActivPilot, DKR, DKL, słupek stały, słupek ruchomy, wymiary w milimetrach.",
    });
    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("WORKSPACE_TRANSCRIPTION_FAILED", { name: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ message: "Nie udało się odczytać nagrania. Spróbuj ponownie lub wpisz polecenie." }, { status: 503 });
  }
}
