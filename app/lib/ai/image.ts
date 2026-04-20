import { openai } from "./openai";
import { File } from "buffer";
import { getMaskFromRemoveBg } from "./removeBackground";

/* ================= HELPERS ================= */

function base64ToFile(base64: string, filename: string): File {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const bytes = Buffer.from(clean, "base64");

  return new File([bytes], filename, {
    type: "image/png",
    lastModified: Date.now(),
  });
}

/* ================= MAIN ================= */

type ProcessImageParams = {
  file: string;
  prompt: string;
  mask?: string | null;
};

export async function processImage({
  file,
  prompt,
  mask,
}: ProcessImageParams) {
  const lower = prompt.toLowerCase();

  const imageFile = base64ToFile(file, "image.png");
  const maskFile = mask ? base64ToFile(mask, "mask.png") : undefined;

  const isRemoveBg =
    lower.includes("usuń tło") ||
    lower.includes("remove background");

  const isChangeBg =
    lower.includes("zmień tło") ||
    lower.includes("change background");

  /* ================= AUTO MASK (MVP) ================= */

  if (isRemoveBg || isChangeBg) {
  try {
    const maskBase64 = await getMaskFromRemoveBg(file);

    const imageFile = base64ToFile(file, "image.png");
    const maskFile = base64ToFile(maskBase64, "mask.png");

    return await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      mask: maskFile,
      prompt: `
      ${prompt}

    Zachowaj główny obiekt.
    Naturalne światło.
    Brak artefaktów.

  Dodaj bardzo subtelny znak wodny "NaviMind AI" w dolnym rogu.
  `,
      size: "1024x1024",
    });
  } catch (err) {
    console.error("AUTO MASK FAILED:", err);

    // 🔁 fallback (to co masz teraz)
    return await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });
  }
}

  /* ================= MASK (manual) ================= */

  if (maskFile) {
    return await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      mask: maskFile,
      prompt,
      size: "1024x1024",
    });
  }

  /* ================= STANDARD EDIT ================= */

  return await openai.images.generate({
    model: "gpt-image-1",
    prompt: `
Edytuj obraz:

${prompt}

Zachowaj:
- strukturę
- realizm
- twarz (jeśli jest)

Brak artefaktów.
`,
    size: "1024x1024",
  });
}