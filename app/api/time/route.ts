import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();

  return NextResponse.json({
    iso: now.toISOString(),
    unix: now.getTime(),
    pl: now.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" }),
    tz: "Europe/Warsaw",
  });
}