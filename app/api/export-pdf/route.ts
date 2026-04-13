import PDFDocument from "pdfkit";
import { Buffer } from "buffer";
import { getUserPlan } from "../../lib/userPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportPdfBody = {
  title?: string;
  content?: string;
};

export async function POST(req: Request) {
  try {
    const plan = await getUserPlan();

    if (plan === "free") {
    return new Response(
    JSON.stringify({ error: "PRO_REQUIRED" }),
    { status: 403 }
  );
}
    const body: ExportPdfBody = await req.json().catch(() => ({}));
    const title = body?.title;
    const content = body?.content;

    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "NO_CONTENT" }), {
        status: 400,
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      if (title) {
        doc.font("Helvetica-Bold").fontSize(18).text(title).moveDown();
      }

      doc.font("Helvetica").fontSize(11).text(content, {
        lineGap: 4,
        align: "left",
      });

      doc.end();
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="navimind.pdf"',
      },
    });
  } catch (err) {
    console.error("PDF EXPORT ERROR:", err);

    return new Response(JSON.stringify({ error: "PDF_EXPORT_FAILED" }), {
      status: 500,
    });
  }
}