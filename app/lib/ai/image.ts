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
  const manualMask = mask ? base64ToFile(mask, "mask.png") : undefined;

  const isRemoveBg =
    lower.includes("usuń tło") ||
    lower.includes("remove background");

  const isChangeBg =
    lower.includes("zmień tło") ||
    lower.includes("change background");

  /* ================= AUTO MASK ================= */

  if (isRemoveBg || isChangeBg) {
    try {
      const maskBase64 = await getMaskFromRemoveBg(file);
      const autoMask = base64ToFile(maskBase64, "mask.png");

      return await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        mask: autoMask,
        prompt: `
${prompt}

Zachowaj główny obiekt.
Naturalne światło.
Brak artefaktów.
`,
        size: "1024x1024",
      });
    } catch (err) {
      console.error("AUTO MASK FAILED:", err);

      // 🔥 fallback = dalej EDYCJA (bez maski)
      return await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: `
        ${prompt}

      CRITICAL RULES:
      - Replace the background completely
      - Do NOT overlay or blend images
      - Do NOT duplicate the original image
      - Output must be a SINGLE clean image

      Keep:
      - main subject
      - proportions
      - realism

      No artifacts
      `,
        size: "1024x1024",
      });
    }
  }

  /* ================= MANUAL MASK ================= */

  if (manualMask) {
    return await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      mask: manualMask,
      prompt,
      size: "1024x1024",
    });
  }

  /* ================= STANDARD EDIT ================= */

  return await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt: `
${prompt}

Zachowaj:
- strukturę obrazu
- twarz (jeśli jest)
- realizm

Brak artefaktów.
`,
    size: "1024x1024",
  });
}