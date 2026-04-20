import pdfParse from "pdf-parse";
import { openai } from "../ai/openai";

export async function processPdf(base64: string, prompt: string) {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;

  const buffer = Buffer.from(clean, "base64");
  const parsed = await pdfParse(buffer);

  const text = parsed.text;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `
Polecenie:
${prompt}

TEKST:
${text.slice(0, 20000)}
`,
  });

  return response.output_text || "";
}