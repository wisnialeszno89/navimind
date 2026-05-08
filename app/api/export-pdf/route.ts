import { createPdfBuffer } from "@/lib/pdf/createPdfBuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportPdfBody = {
  title?: string;
  content?: string;
};

export async function POST(req: Request) {
  try {
    const body: ExportPdfBody = await req.json().catch(() => ({}));

    const title = body?.title;
    const content = body?.content;

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "NO_CONTENT" }),
        {
          status: 400,
        }
      );
    }

    const pdfBuffer = await createPdfBuffer(
      content,
      title
    );

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="navimind.pdf"',
      },
    });

  } catch (err) {
    console.error("PDF EXPORT ERROR:", err);

    return new Response(
      JSON.stringify({ error: "PDF_EXPORT_FAILED" }),
      {
        status: 500,
      }
    );
  }
}