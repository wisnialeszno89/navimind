import { getUserId } from "../../lib/userId";
import { getUserPlan } from "../../lib/userPlan";
import { PLAN_LIMITS } from "../../lib/plans";
import { getCurrentDailyLimit } from "../../lib/dailyLimit";
import { getCurrentLimit, FREE_HARD_LIMIT } from "../../lib/chatLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUidFromUrl(req: Request) {
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    return uid && uid.trim().length > 0 ? uid.trim() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const uidFromUrl = getUidFromUrl(req);
    const cookieUserId = getUserId();

    const userId = uidFromUrl ?? cookieUserId;

    if (!userId) {
      return Response.json({
        plan: "free",
        allowed: true,
        used: 0,
        remaining: FREE_HARD_LIMIT,
        limit: FREE_HARD_LIMIT,
        resetAt: Date.now(),
      });
    }

    const plan = await getUserPlan();

    // ✅ FREE = demo limit
    if (plan === "free") {
      const limit = await getCurrentLimit(userId, FREE_HARD_LIMIT);
      return Response.json({ plan, ...limit });
    }

    // ✅ PRO/PRO+ = daily limit
    const dailyLimit = PLAN_LIMITS[plan].dailyMessages;
    const limit = await getCurrentDailyLimit(userId, dailyLimit);

    return Response.json({ plan, ...limit });
  } catch (err) {
    console.error("LIMIT API ERROR:", err);
    return new Response(JSON.stringify({ error: "SERVER_ERROR" }), {
      status: 500,
    });
  }
}
