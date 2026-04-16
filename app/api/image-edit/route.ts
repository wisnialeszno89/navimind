import { NextResponse } from "next/server";
import { getUserPlan } from "../../lib/userPlan";
import { getUserId } from "../../lib/userId";
import { checkAndIncrementMonthlyUsage } from "../../lib/monthlyUsage";
import { PLAN_LIMITS } from "../../lib/plans";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const userId = getUserId();
    const plan = (await getUserPlan()) as keyof typeof PLAN_LIMITS;
    if (!PLAN_LIMITS[plan]) {
    throw new Error("Invalid plan");
  }

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // ❌ FREE blokujemy
    if (plan === "free") {
      return NextResponse.json(
        { error: "PRO_REQUIRED" },
        { status: 403 }
      );
    }

    /* ================= LIMITY ================= */

// 🔥 DAILY (najpierw!)
const limit = PLAN_LIMITS[plan].monthlyFiles;

const usage = await checkAndIncrementMonthlyUsage(
  userId,
  "file",
  limit
);

const dailyLimit = PLAN_LIMITS[plan].dailyFiles;

const dailyUsage = await checkAndIncrementMonthlyUsage(
  userId,
  "file_daily",
  dailyLimit
);

if (!dailyUsage.allowed) {
  return NextResponse.json(
    { error: "DAILY_LIMIT" },
    { status: 429 }
  );
}


// 🔥 MONTHLY
const monthlyLimit = PLAN_LIMITS[plan].monthlyFiles;

const monthlyUsage = await checkAndIncrementMonthlyUsage(
  userId,
  "file",
  limit
);

if (!usage.allowed) {
  return NextResponse.json(
    { error: "MONTHLY_LIMIT", remaining: 0 },
    { status: 429 }
  );
}

    const { image, prompt } = await req.json();

    if (!image || !prompt) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const { default: OpenAI } = await import("openai");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 🧠 ANALIZA (lekka)
    const analysis = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Opisz obraz krótko." },
            {
              type: "input_image",
              image_url: image,
              detail: "low",
            },
          ],
        },
      ],
    });

    const description = analysis.output_text || "";

    // 🎨 FINAL PROMPT
    const finalPrompt = `
Obraz:
${description}

Zrób zmianę:
${prompt}

Zachowaj twarz, proporcje i realizm.
Wysoka jakość.
`;

    // 🎨 GENERACJA
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: finalPrompt,
      size: "1024x1024",
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "GENERATION_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: imageBase64,
      meta: {
        used: usage.used,
        remaining: usage.remaining,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "IMAGE_EDIT_FAILED" },
      { status: 500 }
    );
  }
}