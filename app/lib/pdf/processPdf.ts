import pdfParse from "pdf-parse";

export async function processPdf(base64: string) {
  const clean = base64.includes(",")
    ? base64.split(",")[1]
    : base64;

  const buffer = Buffer.from(clean, "base64");

  const data = await pdfParse(buffer);

// 🔥 FIX ENCODING + NORMALIZACJA
  const text = data.text
  .normalize("NFKC")
  .replace(/\r/g, "")
  .replace(/\t/g, " ")
  .replace(/\u0000/g, "");

  return text;
}