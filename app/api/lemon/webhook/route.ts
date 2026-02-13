import { NextResponse } from "next/server";
import crypto from "crypto";
import { setPlanByEmail, type Plan } from "../../../lib/userPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * LemonSqueezy webhook verification:
 * signature header: X-Signature
 * HMAC SHA256 of raw request body with webhook secret
 */
function verifySignature(rawBody: string, signature: string, secret: string) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");

  const a = Buffer.from(digest);
  const b = Buffer.from(signature || "");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function detectPlanFromVariant(
  variantId: number | null | undefined
): Plan | null {
  const proVariant = Number(process.env.LEMON_VARIANT_PRO_PLN || 0);
  const proPlusVariant = Number(process.env.LEMON_VARIANT_PROPLUS_PLN || 0);

  if (!variantId) return null;
  if (variantId === proPlusVariant) return "pro_plus";
  if (variantId === proVariant) return "pro";
  return null;
}

export async function POST(req: Request) {
  try {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "MISSING_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();

    const signature = req.headers.get("x-signature") || "";
    const ok = verifySignature(rawBody, signature, secret);

    if (!ok) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    const eventName = payload?.meta?.event_name as string | undefined;

    const email =
      payload?.data?.attributes?.user_email ||
      payload?.data?.attributes?.customer_email ||
      payload?.data?.attributes?.billing_email;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "NO_EMAIL_IN_WEBHOOK" }, { status: 400 });
    }

    const variantIdRaw =
      payload?.data?.attributes?.variant_id ||
      payload?.data?.attributes?.first_subscription_item?.variant_id ||
      payload?.data?.attributes?.subscription_item?.variant_id ||
      payload?.data?.attributes?.order_item?.variant_id ||
      null;

    const variantId =
      typeof variantIdRaw === "number"
        ? variantIdRaw
        : Number(variantIdRaw || 0);

    const plan = detectPlanFromVariant(variantId);

    if (!plan) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "UNKNOWN_VARIANT",
        eventName,
        variantId,
      });
    }

    const emailNorm = normalizeEmail(email);

    const downgradeEvents = new Set([
      "subscription_cancelled",
      "subscription_expired",
      "subscription_paused",
      "subscription_unpaid",
      "order_refunded",
      "order_chargeback_created",
    ]);

    if (eventName && downgradeEvents.has(eventName)) {
      await setPlanByEmail(emailNorm, "free");
      return NextResponse.json({ ok: true, plan: "free", eventName });
    }

    await setPlanByEmail(emailNorm, plan);

    return NextResponse.json({ ok: true, plan, eventName });
  } catch (e) {
    console.error("LEMON WEBHOOK ERROR:", e);
    return NextResponse.json({ error: "WEBHOOK_FAILED" }, { status: 500 });
  }
}