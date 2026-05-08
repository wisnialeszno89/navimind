import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import fs from "fs";
import path from "path";

export async function createPdfBuffer(
  content: string,
  title?: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  pdfDoc.registerFontkit(fontkit);

  const fontPath = path.join(
    process.cwd(),
    "public/fonts/NotoSans-Regular.ttf"
  );

  const fontBytes = fs.readFileSync(fontPath);

  const font = await pdfDoc.embedFont(fontBytes);

  let page = pdfDoc.addPage([595, 842]);

  const { height } = page.getSize();

  let y = height - 50;

  // TITLE
  if (title) {
    page.drawText(title, {
      x: 50,
      y,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 40;
  }

  // CONTENT
  const lines = content.split("\n");

  for (const line of lines) {
    if (y < 50) {
      page = pdfDoc.addPage([595, 842]);
      y = height - 50;
    }

    page.drawText(line, {
      x: 50,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
      maxWidth: 500,
    });

    y -= 18;
  }

  const pdfBytes = await pdfDoc.save();

  return Buffer.from(pdfBytes);
}