console.log("🔥 FILE PROCESS HIT");
import { NextResponse } from "next/server";
import { getUserPlan } from "../../lib/userPlan";
import { getUserId } from "../../lib/userId";
import { PLAN_LIMITS } from "../../lib/plans";
import { checkAndIncrementMonthlyUsage } from "../../lib/monthlyUsage";

import { processImage } from "../../lib/ai/image";
import { processPdf } from "../../lib/pdf/processPdf";
import { generatePdf } from "../../lib/pdf/generatePdf";
import { canUse } from "../../lib/usage/permissions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const userId = getUserId();
    const plan = await getUserPlan();

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { file, type, prompt, mask } = await req.json();

    if (!file || !type || !prompt) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    /* ================= IMAGE ================= */
    const isAutoMask =
    prompt.toLowerCase().includes("usuń tło") ||
    prompt.toLowerCase().includes("remove background");

  if (isAutoMask) {
  if (plan !== "pro_plus") {
    return NextResponse.json(
      { error: "PRO_PLUS_REQUIRED" },
      { status: 403 }
    );
  }

  const limit = PLAN_LIMITS[plan].autoMask;

  const usage = await checkAndIncrementMonthlyUsage(
    userId,
    "auto_mask",
    limit
  );

  if (!usage.allowed) {
    return NextResponse.json(
      { error: "AUTO_MASK_LIMIT" },
      { status: 429 }
    );
  }
}
  const lower = prompt.toLowerCase();
  const isAnalysis =
  lower.includes("co jest") ||
  lower.includes("opisz") ||
  lower.includes("co widzisz") ||
  lower.includes("what is") ||
  lower.includes("describe");

  const flags = {
    isAutoMask:
    lower.includes("usuń tło") ||
    lower.includes("remove background"),

    isEdit:
    lower.includes("zmień") ||
    lower.includes("popraw"),

    isSummary:
    lower.includes("podsumuj"),
};

    if (type.startsWith("image/")) {
  if (!canUse(plan, "image")) {
    return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });
  }

  // 🧠 ANALIZA (nie generujemy obrazu!)
  if (isAnalysis) {
    const { default: OpenAI } = await import("openai");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: file,
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      type: "text",
      data: response.output_text || "Brak odpowiedzi",
    });
  }

  // 🎨 EDYCJA OBRAZU
  const result = await processImage({ file, prompt, mask });

  const imageBase64 = result.data?.[0]?.b64_json;

  return NextResponse.json({
    type: "image",
    data: imageBase64,
  });
}

    /* ================= PDF ================= */

    if (type === "application/pdf") {
      if (!canUse(plan, "pdf_read")) {
        return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });
      }

      const text = await processPdf(file, prompt);

      const isEdit = /zmień|popraw|przerób|tłumacz|skr[oó]c/.test(
        prompt.toLowerCase()
      );

      if (isEdit) {
        if (!canUse(plan, "pdf_edit")) {
          return NextResponse.json(
            { error: "PRO_PLUS_REQUIRED" },
            { status: 403 }
          );
        }

        const pdfBuffer = await generatePdf(text);

        return NextResponse.json({
          type: "pdf",
          data: pdfBuffer.toString("base64"),
          preview: text.slice(0, 300),
        });
      }

      return NextResponse.json({
        type: "text",
        data: text,
      });
    }

    return NextResponse.json(
      { error: "UNSUPPORTED_TYPE" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "PROCESS_FAILED" },
      { status: 500 }
    );
  }
}