import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    // 🔥 dynamic imports (KLUCZ)
    const pdf = (await import("pdf-parse")).default;
    const PDFDocument = (await import("pdfkit")).default;
    const OpenAI = (await import("openai")).default;

    const { getUserPlan } = await import("../../lib/userPlan");
    const { checkPdfLimit, incrementPdfUsage } = await import("../../lib/usage");

    const plan = await getUserPlan();

    if (plan !== "pro_plus") {
      return NextResponse.json({ error: "PRO_PLUS_REQUIRED" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const instruction = formData.get("instruction") as string;

    if (!file) {
      return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
    }

    const userId = "TODO_USER_ID";

    const limit = await checkPdfLimit(userId);
    if (!limit.allowed) {
      return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);

    if (parsed.numpages > 20) {
      return NextResponse.json({ error: "PDF_TOO_LARGE" }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    const ai = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
Popraw tekst z PDF zgodnie z instrukcją użytkownika.
Zwróć tylko gotowy tekst.
          `,
        },
        {
          role: "user",
          content: `
Instrukcja:
${instruction || "Popraw i uprość tekst."}

TEKST:
${parsed.text}
          `,
        },
      ],
    });

    const newText = ai.choices[0]?.message?.content || "Brak wyniku";

    const doc = new PDFDocument();
    const chunks: Uint8Array[] = [];

    doc.on("data", (c) => chunks.push(c));

    const pdfBuffer: Buffer = await new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc
        .font("Helvetica")
        .fontSize(11)
        .text(newText, { width: 450 });

      doc.end();
    });

    await incrementPdfUsage(userId);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(".pdf", "")}-edited.pdf"`,
      },
    });

  } catch (e) {
    return NextResponse.json({ error: "PDF_EDIT_FAILED" }, { status: 500 });
  }
}