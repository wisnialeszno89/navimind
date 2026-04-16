import { NextResponse } from "next/server";
import { getUserId } from "../../lib/userId";
import { getUserPlan } from "../../lib/userPlan";
import { PLAN_LIMITS } from "../../lib/plans";
import { checkAndIncrementMonthlyUsage } from "../../lib/monthlyUsage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = getUserId();
    const plan = (await getUserPlan()) as keyof typeof PLAN_LIMITS;

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const limits = PLAN_LIMITS[plan];

    /* ================= DAILY ================= */

    const dailyLimit = limits.dailyFiles;

    const dailyUsage = await checkAndIncrementMonthlyUsage(
      userId,
      "file",
      dailyLimit
    );

    const dailyUsed = dailyUsage.used;
    const dailyLeft = dailyUsage.remaining;
    const dailyResetAt = dailyUsage.resetAt;

    /* ================= MONTHLY ================= */

    const monthlyLimit = limits.monthlyFiles;

    const files = await checkAndIncrementMonthlyUsage(
      userId,
      "file",
      monthlyLimit
    );

    /* ================= RESPONSE ================= */

    return NextResponse.json({
      plan,
      limits,
      usage: {
        daily: {
          used: dailyUsed,
          left: dailyLeft,
          resetAt: dailyResetAt,
        },
        monthly: {
          used: files.used,
          left: files.remaining,
          limit: files.limit,
          resetAt: files.resetAt,
        },
      },
    });

  } catch (err) {
    console.error("USAGE ERROR:", err);

    return NextResponse.json(
      { error: "USAGE_FAILED" },
      { status: 500 }
    );
  }
}