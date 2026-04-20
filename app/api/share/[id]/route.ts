import { NextResponse } from "next/server";
import { getShare } from "../../../lib/shareStore";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const image = getShare(params.id);

  if (!image) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ image });
}