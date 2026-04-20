export async function getMaskFromRemoveBg(base64: string): Promise<string> {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.REMOVE_BG_API_KEY!,
    },
    body: new URLSearchParams({
      image_file_b64: clean,
      size: "auto",
      format: "png",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("remove.bg error: " + text);
  }

  const buffer = await res.arrayBuffer();

  return Buffer.from(buffer).toString("base64");
}