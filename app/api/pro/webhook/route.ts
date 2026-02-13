import { NextResponse } from "next/server";
import crypto from "crypto";
import { setPlanByEmail } from "../../../lib/userPlan";

export const runtime = "nodejs";

function verifyLemonSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");

  return digest === signature;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("X-Signature");

  // 🔐 twarda weryfikacja webhooka
  const verified = verifyLemonSignature(raw, signature);
  if (!verified) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const eventName = payload?.meta?.event_name as string | undefined;
  const data = payload?.data;

  // 📧 email klienta (różne pola w Lemon)
  const email: string | undefined =
    data?.attributes?.user_email ||
    data?.attributes?.customer_email ||
    data?.attributes?.email;

  // 🆔 variant produktu
  const variantId = Number(data?.attributes?.variant_id);

  const proVariant = Number(process.env.LEMON_VARIANT_PRO_PLN);
  const proPlusVariant = Number(process.env.LEMON_VARIANT_PROPLUS_PLN);

  if (!email || !variantId) {
    // webhook poprawny, ale nie dotyczy planów
    return NextResponse.json({ ok: true, ignored: true });
  }

  // 📌 eventy aktywujące dostęp
  const shouldActivate =
    eventName === "subscription_created" ||
    eventName === "subscription_updated" ||
    eventName === "subscription_payment_success" ||
    eventName === "order_created";

  // 📌 eventy wyłączające dostęp
  const shouldDisable =
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired";

  try {
    if (shouldActivate) {
      if (variantId === proVariant) {
        await setPlanByEmail(email, "pro");
      } else if (variantId === proPlusVariant) {
        await setPlanByEmail(email, "pro_plus");
      }
    }

    if (shouldDisable) {
      // w przyszłości można dodać "active_until"
      await setPlanByEmail(email, "free");
    }
  } catch (err) {
    console.error("LEMON WEBHOOK ERROR", err);
    return NextResponse.json({ error: "PLAN_UPDATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
