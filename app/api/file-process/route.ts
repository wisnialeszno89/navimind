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

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!PLAN_LIMITS[plan]) {
      throw new Error("Invalid plan");
    }

    const { file, type, prompt } = await req.json();

    if (!file || !type || !prompt) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const lower = prompt.toLowerCase();

    const isEdit =
      lower.includes("zmień") ||
      lower.includes("popraw") ||
      lower.includes("przerób");

    const isTranslate = /tłumacz|translate/.test(lower);
    const isSummary = /skr[oó]c|podsumuj/.test(lower);

    if (plan === "free") {
      return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });
    }

    /* ================= LIMITY ================= */

    const dailyLimit = PLAN_LIMITS[plan].dailyFiles;

    const dailyUsage = await checkAndIncrementMonthlyUsage(
      userId,
      "file_daily",
      dailyLimit
    );

    if (!dailyUsage.allowed) {
      return NextResponse.json({ error: "DAILY_LIMIT" }, { status: 429 });
    }

    const monthlyLimit = PLAN_LIMITS[plan].monthlyFiles;

    const usage = await checkAndIncrementMonthlyUsage(
      userId,
      "file",
      monthlyLimit
    );

    if (!usage.allowed) {
      return NextResponse.json({ error: "MONTHLY_LIMIT" }, { status: 429 });
    }

    /* ================= OPENAI ================= */

    const { default: OpenAI } = await import("openai");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    /* ================= IMAGE ================= */

    if (type.startsWith("image/")) {
      const analysis = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Opisz obraz krótko." },
              {
                type: "input_image",
                image_url: file,
                detail: "low",
              },
            ],
          },
        ],
      });

      const description = analysis.output_text || "";

      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `
        Edytuj obraz zgodnie z poleceniem:
    
      if (plan !== "pro_plus" && isEdit && type === "application/pdf") {
      return NextResponse.json(
    { error: "PRO_PLUS_REQUIRED" },
    { status: 403 }
  );
}

${prompt}

Opis obrazu:
${description}

Zachowaj:
- strukturę
- proporcje
- realizm

Wysoka jakość, brak deformacji.
`,
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
        type: "image",
        data: imageBase64,
        meta: usage,
      });
    }

    /* ================= PDF ================= */

    if (type === "application/pdf") {
      const pdf = (await import("pdf-parse")).default;

      const base64 = file.includes(",") ? file.split(",")[1] : file;
      const buffer = Buffer.from(base64, "base64");

      const parsed = await pdf(buffer);
      const text = parsed.text;

      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: `
Polecenie:
${prompt}

TEKST PDF:
${text.slice(0, 20000)}
`,
      });

      const resultText = response.output_text || "Brak odpowiedzi";

      /* 🔥 JEŚLI EDYCJA → GENERUJ PDF */
      if (isEdit || isTranslate || isSummary) {
        const PDFDocument = (await import("pdfkit")).default;

        const doc = new PDFDocument();
        const chunks: Uint8Array[] = [];

        doc.on("data", (c) => chunks.push(c));

        const pdfBuffer: Buffer = await new Promise((resolve) => {
          doc.on("end", () => resolve(Buffer.concat(chunks)));

          doc.font("Helvetica").fontSize(11).text(resultText, {
            width: 450,
          });

          doc.end();
        });

        return NextResponse.json({
          type: "pdf",
          data: pdfBuffer.toString("base64"),
          preview: resultText.slice(0, 300),
          meta: usage,
        });
      }

      /* 🔥 ANALIZA → ZWYKŁY TEKST */
      return NextResponse.json({
        type: "text",
        data: resultText,
        preview: resultText.slice(0, 300),
        meta: usage,
      });
    }

    return NextResponse.json(
      { error: "UNSUPPORTED_TYPE" },
      { status: 400 }
    );
  } catch (err) {
    console.error("FILE PROCESS ERROR:", err);

    return NextResponse.json(
      { error: "PROCESS_FAILED" },
      { status: 500 }
    );
  }
}