import { NextResponse } from "next/server";
import { getUserPlan } from "../../lib/userPlan";
import { getUserId } from "../../lib/userId";
import { checkAndIncrementMonthlyUsage } from "../../lib/monthlyUsage";
import { PLAN_LIMITS } from "../../lib/plans";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const userId = getUserId();
    const plan = await getUserPlan();

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (plan !== "pro") {
      return NextResponse.json(
        { error: "PRO_REQUIRED", message: "Edycja zdjęć tylko w PRO+" },
        { status: 403 }
      );
    }

    const limit = PLAN_LIMITS[plan].monthlyImages;

    const usage = await checkAndIncrementMonthlyUsage(
      userId,
      "image",
      limit
    );

    if (!usage.allowed) {
      return NextResponse.json(
        { error: "IMAGE_LIMIT", remaining: 0 },
        { status: 429 }
      );
    }

    const { image, prompt } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "NO_IMAGE" }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: "NO_PROMPT" }, { status: 400 });
    }

    const { default: OpenAI } = await import("openai");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const FINAL_PROMPT = `
    Zachowaj tożsamość osoby, twarz i proporcje.
    Naturalne światło, realistyczne detale, wysoka jakość.
    Nie zmieniaj osoby w inną.
    ${prompt}
    `;

    const result = await openai.responses.create({
     model: "gpt-4.1-mini",
    input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: FINAL_PROMPT },
        {
            type: "input_image",
            image_url: image,
            detail: "low", // 🔥 TO JEST KLUCZ
        },
      ],
    },
  ],
});

    return NextResponse.json({
      image: result.data[0].b64_json,
      meta: {
        used: usage.used,
        remaining: usage.remaining,
      },
    });
  } catch (err) {
    console.error("IMAGE EDIT ERROR:", err);

    return NextResponse.json(
      { error: "IMAGE_EDIT_FAILED" },
      { status: 500 }
    );
  }
}