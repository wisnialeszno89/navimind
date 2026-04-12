import { NextResponse } from "next/server";
import { setPlanByEmail } from "../../../lib/userPlan";

export const runtime = "nodejs";

export async function GET() {
  await setPlanByEmail("adam.wisniewski89@wp.pl", "pro_plus");

  return NextResponse.json({
    ok: true,
    message: "PRO+ activated"
  });
}