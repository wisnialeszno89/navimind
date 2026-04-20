import { NextResponse } from "next/server";
import { getAllShares } from "../../../lib/shareStore";

export async function GET() {
  const items = getAllShares();

  return NextResponse.json({ items });
}