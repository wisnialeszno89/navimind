import { NextResponse } from "next/server";
import { getUserId } from "../../lib/userId";
import { getUserPlan } from "../../lib/userPlan";
import { PLAN_LIMITS } from "../../lib/plans";
import { checkAndIncrementMonthlyUsage } from "../../lib/monthlyUsage";

export const runtime = "nodejs";

const VISION_SYSTEM_PROMPT = `
Jesteś NaviMind.

ZASADA:
Opisujesz WYŁĄCZNIE to, co widać.
Bez interpretacji. Bez porad. Bez emotek.
Krótko i neutralnie.
`;

export async function POST(req: Request) {
  try {
    const userId = getUserId();
    const plan = await getUserPlan();

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (plan === "free") {
      return NextResponse.json(
        { error: "PRO_REQUIRED", message: "Zdjęcia są dostępne w PRO." },
        { status: 403 }
      );
    }

    /* 🔒 LIMIT MIESIĘCZNY */
    const imageLimit = PLAN_LIMITS[plan].monthlyFiles;
    const usage = await checkAndIncrementMonthlyUsage(
      userId,
      "file",
      imageLimit
    );

    if (!usage.allowed) {
      return NextResponse.json(
        { error: "IMAGE_LIMIT", remaining: 0, resetAt: usage.resetAt },
        { status: 429 }
      );
    }

    /* 📦 PLIK */
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "INVALID_IMAGE" }, { status: 400 });
    }

    /* 🔥 RUNTIME OPENAI */
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    /* 📤 Upload do blob przez /api/upload */
    const upload = new FormData();
    upload.append("file", file);

    const uploadRes = await fetch(new URL("/api/upload", req.url), {
      method: "POST",
      body: upload,
    });

    const uploadData = await uploadRes.json().catch(() => null);

    if (!uploadRes.ok || !uploadData?.url) {
      return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
    }

    /* 👁️ VISION */
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Opisz obraz." },
            {
              type: "image_url",
              image_url: { url: uploadData.url },
            },
          ] as any,
        },
      ],
    });

    const message = completion.choices[0]?.message?.content?.trim();

    if (!message) {
      return NextResponse.json({ error: "EMPTY_RESPONSE" }, { status: 500 });
    }

    return NextResponse.json({
      message,
      meta: {
        used: usage.used,
        remaining: usage.remaining,
        resetAt: usage.resetAt,
      },
    });
  } catch (err) {
    console.error("VISION ERROR:", err);
    return NextResponse.json({ error: "VISION_FAILED" }, { status: 500 });
  }
}
