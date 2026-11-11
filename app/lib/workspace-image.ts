export const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
export const MAX_WORKSPACE_BODY_BYTES = 3 * 1024 * 1024;

export async function readWorkspaceBody(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > MAX_WORKSPACE_BODY_BYTES) throw new Error("REQUEST_TOO_LARGE");
  const reader = req.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_WORKSPACE_BODY_BYTES) { await reader.cancel(); throw new Error("REQUEST_TOO_LARGE"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function workspaceImage(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > Math.ceil(MAX_SCREENSHOT_BYTES / 3) * 4 + 64) throw new Error("INVALID_SCREENSHOT");
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new Error("INVALID_SCREENSHOT");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_SCREENSHOT_BYTES || bytes.toString("base64") !== match[2]) throw new Error("INVALID_SCREENSHOT");
  const valid = match[1] === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) :
    match[1] === "jpeg" ? bytes.subarray(0,3).equals(Buffer.from([255,216,255])) :
    bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP";
  if (!valid) throw new Error("INVALID_SCREENSHOT");
  return value;
}
