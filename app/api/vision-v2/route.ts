import { NextResponse } from "next/server";
import { getUserPlan } from "../../lib/userPlan";
import { getUserId } from "../../lib/userId";
import { checkAndIncrementMonthlyUsage } from "../../lib/monthlyUsage";
import { PLAN_LIMITS } from "../../lib/plans";
import { Buffer } from "buffer";

export const runtime = "nodejs";

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

    // 🔒 LIMIT
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

    // 📦 PLIK
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "INVALID_IMAGE" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // 🔥 OPENAI (NOWE API)
    const { default: OpenAI } = await import("openai");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Opisz obraz krótko i neutralnie." },
            {
            type: "input_image",
            image_url: `data:${file.type};base64,${base64}`,
            detail: "low",
            }
          ],
        },
      ],
    });

    return NextResponse.json({
      message: res.output_text,
      meta: {
        used: usage.used,
        remaining: usage.remaining,
      },
    });
  } catch (err) {
    console.error("VISION V2 ERROR:", err);

    return NextResponse.json(
      { error: "VISION_FAILED" },
      { status: 500 }
    );
  }
}