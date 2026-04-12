import { NextResponse } from "next/server";
import { getUserPlan } from "../../lib/userPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plan = await getUserPlan();

    return NextResponse.json({
      plan: plan || "free",
    });
  } catch (e) {
    console.error("PRO API ERROR:", e);

    return NextResponse.json({
      plan: "free",
    });
  }
}