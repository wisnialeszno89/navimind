import PDFDocument from "pdfkit";
import { Buffer } from "buffer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content: string | undefined = body?.content;
    const title: string | undefined = body?.title;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "NO_CONTENT" }),
        { status: 400 }
      );
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk: Uint8Array) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      /* noop */
    });

    // ====== TREŚĆ ======
    if (title) {
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(title)
        .moveDown();
    }

    doc
      .font("Helvetica")
      .fontSize(11)
      .text(content, {
        lineGap: 4,
      });

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="navimind.pdf"',
      },
    });
  } catch (err) {
    console.error("PDF EXPORT ERROR:", err);
    return new Response(
      JSON.stringify({ error: "PDF_EXPORT_FAILED" }),
      { status: 500 }
    );
  }
}