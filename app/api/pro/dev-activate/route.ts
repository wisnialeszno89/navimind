import { NextResponse } from "next/server";
import { setUserPlan, Plan } from "../../../lib/userPlan";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const plan = (body?.plan as Plan) || "pro";

    if (plan !== "free" && plan !== "pro" && plan !== "pro_plus") {
      return NextResponse.json(
        { error: "INVALID_PLAN" },
        { status: 400 }
      );
    }

    // ✅ aktywuje plan dla ZALOGOWANEGO usera (email z sesji)
    await setUserPlan(plan);

    return NextResponse.json({ ok: true, plan });
  } catch (e) {
    console.error("DEV ACTIVATE ERROR:", e);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}