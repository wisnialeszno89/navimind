import PDFDocument from "pdfkit";

export async function generatePdf(text: string): Promise<Buffer> {
  const doc = new PDFDocument();
  const chunks: Uint8Array[] = [];

  doc.on("data", (c) => chunks.push(c));

  return await new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.font("Helvetica").fontSize(11).text(text, {
      width: 450,
    });

    doc.end();
  });
}