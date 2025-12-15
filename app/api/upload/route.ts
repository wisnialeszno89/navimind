import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    console.log("FILE:", file?.name, file?.type, file?.size);

    if (!file) {
      return NextResponse.json(
        { error: "NO FILE" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (e) {
    console.error("FORMDATA ERROR:", e);
    return NextResponse.json(
      { error: "FORMDATA FAIL" },
      { status: 500 }
    );
  }
}