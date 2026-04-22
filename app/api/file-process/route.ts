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
    console.log("🔥 FILE PROCESS HIT");

    const userId = getUserId();
    const plan = await getUserPlan();

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  
    const { file, type, prompt, mask } = await req.json();

    if (!file || !type || !prompt) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const lower = prompt.toLowerCase();

    /* ================= IMAGE ================= */

    const isAnalysis =
      lower.includes("co jest") ||
      lower.includes("opisz") ||
      lower.includes("co widzisz") ||
      lower.includes("what is") ||
      lower.includes("describe");

    if (type.startsWith("image/")) {
      if (!canUse(plan, "image")) {
        return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });
      }

      // 🧠 ANALIZA
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
                  detail: "low",
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

      // 🎨 EDYCJA
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
  
  const originalText = await processPdf(file);
  const lower = prompt.toLowerCase();

  const isEdit =
    lower.includes("zmień") ||
    lower.includes("popraw") ||
    lower.includes("przerób") ||
    lower.includes("tłumacz") ||
    lower.includes("translate") ||
    lower.includes("angielski") ||
    lower.includes("english");

  const isTranslate =
    lower.includes("tłumacz") ||
    lower.includes("translate") ||
    lower.includes("english") ||
    lower.includes("angielski");

  // 👉 jeśli brak edycji → zwróć tekst
  if (!isEdit) {
    return NextResponse.json({
      type: "text",
      data: originalText,
    });
  }

  if (!canUse(plan, "pdf_edit")) {
    return NextResponse.json(
      { error: "PRO_PLUS_REQUIRED" },
      { status: 403 }
    );
  }
  
  const { default: OpenAI } = await import("openai");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const aiRes = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: isTranslate
          ? `
Przetłumacz CAŁY tekst na język angielski.

ZASADY:
- przetłumacz wszystko
- nie pomijaj nic
- zachowaj linie i układ
- nie dodawaj komentarzy

Zwróć tylko gotowy tekst
`
          : `
Wykonaj polecenie użytkownika na tekście.

Zasady:
- nie dodawaj komentarzy
- zwróć tylko gotowy tekst
`,
      },
      {
        role: "user",
        content: `POLECENIE:\n${prompt}\n\nTEKST:\n${originalText}`,
      },
    ],
  });

  const newText =
    aiRes.choices?.[0]?.message?.content?.trim() || originalText;

  const pdfBuffer = await generatePdf(newText);

  return NextResponse.json({
    type: "pdf",
    data: pdfBuffer.toString("base64"),
  });
}
// fallback (gdy typ nieobsługiwany)
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