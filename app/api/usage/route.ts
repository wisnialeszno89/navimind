import { NextResponse } from "next/server";
import { getSessionEmail } from "../../lib/auth/session";
import { getUserId } from "../../lib/userId";
import { getUserPlan } from "../../lib/userPlan";
import { PLAN_LIMITS } from "../../lib/plans";
import { getCurrentDailyLimit } from "../../lib/dailyLimit";
import { getMonthlyUsageState } from "../../lib/monthlyUsage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // 🔐 wymagamy stabilnego identyfikatora użytkownika
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // plan może być powiązany z sesją mailową
  const email = getSessionEmail();
  const plan = await getUserPlan();

  // jeśli FREE → zwracamy bezpieczne puste usage zamiast 403
  if (plan === "free") {
    return NextResponse.json({
      plan,
      limits: PLAN_LIMITS.free,
      usage: {
        daily: {
          used: 0,
          left: PLAN_LIMITS.free.dailyMessages,
          resetAt: Date.now(),
        },
        monthly: {
          pdf: {
            allowed: false,
            used: 0,
            remaining: 0,
            resetAt: Date.now(),
            limit: 0,
          },
          images: {
            allowed: false,
            used: 0,
            remaining: 0,
            resetAt: Date.now(),
            limit: 0,
          },
        },
      },
    });
  }

  const limits = PLAN_LIMITS[plan];

  // 📅 DAILY MESSAGES — liczone po stabilnym userId
  const daily = await getCurrentDailyLimit(userId, limits.dailyMessages);

  const dailyUsed = daily?.used ?? 0;
  const dailyLeft = Math.max(0, limits.dailyMessages - dailyUsed);
  const dailyResetAt = daily?.resetAt ?? Date.now();

  // 📦 MONTHLY USAGE — również po userId
  const pdf = await getMonthlyUsageState(userId, "pdf", limits.monthlyPdf);
  const images = await getMonthlyUsageState(userId, "image", limits.monthlyImages);

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
        pdf,
        images,
      },
    },
  });
}
