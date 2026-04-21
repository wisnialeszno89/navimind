import { NextResponse } from "next/server";
import { saveShare } from "../../lib/shareStore";

export async function POST(req: Request) {
  const { image } = await req.json();

  if (!image) {
    return NextResponse.json({ error: "NO_IMAGE" }, { status: 400 });
  }

  const id = crypto.randomUUID().slice(0, 8);

  saveShare(id, image);

  return NextResponse.json({ id });
  const clean = image.includes(",") ? image.split(",")[1] : image;

saveShare(id, clean);
}