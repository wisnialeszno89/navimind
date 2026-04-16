import { NextResponse } from "next/server";
import { getUserPlan } from "../../lib/userPlan";

export async function GET() {
  const plan = await getUserPlan();

  return NextResponse.json({
    plan: plan || "free",
  });
}