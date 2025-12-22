import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "NO_FILE" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "NOT_PDF" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);

    const text = data.text
      ?.replace(/\n{3,}/g, "\n\n")
      ?.replace(/[ \t]+\n/g, "\n")
      ?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "EMPTY_PDF" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text,
      meta: {
        pages: data.numpages,
        info: data.info ?? null,
      },
    });
  } catch (err) {
    console.error("PDF PARSE ERROR:", err);
    return NextResponse.json(
      { error: "PDF_PARSE_FAILED" },
      { status: 500 }
    );
  }
}