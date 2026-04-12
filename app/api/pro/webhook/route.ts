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
  console.log("🔥 WEBHOOK HIT");

  const raw = await req.text();
  console.log("RAW:", raw);

  const signature = req.headers.get("X-Signature");

  // 🔐 weryfikacja webhooka
  const verified = verifyLemonSignature(raw, signature);
  if (!verified) {
    console.log("❌ INVALID SIGNATURE");
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.log("❌ JSON PARSE ERROR");
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  console.log("PARSED:", payload);

  const eventName = payload?.meta?.event_name as string | undefined;
  const data = payload?.data;

  console.log("EVENT:", eventName);

  // 📧 email klienta
  const email: string | undefined =
    data?.attributes?.user_email ||
    data?.attributes?.customer_email ||
    data?.attributes?.email;

  console.log("EMAIL:", email);

  // 🆔 variant produktu
  const variantId = Number(data?.attributes?.variant_id);
  console.log("VARIANT:", variantId);

  const proVariant = Number(process.env.LEMON_VARIANT_PRO_PLN);
  const proPlusVariant = Number(process.env.LEMON_VARIANT_PROPLUS_PLN);

  console.log("EXPECTED PRO:", proVariant);
  console.log("EXPECTED PRO+:", proPlusVariant);

  if (!email || !variantId) {
    console.log("⚠️ Missing email or variant");
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    // 🔥 HARD TEST (na 100% ustawia plan)
    await setPlanByEmail("adam.wisniewski89@wp.pl", "pro_plus");
    console.log("🔥 FORCED PLAN SET");

    // normalna logika (na później)
    if (eventName === "order_created") {
      if (variantId === proVariant) {
        await setPlanByEmail(email, "pro");
      }

      if (variantId === proPlusVariant) {
        await setPlanByEmail(email, "pro_plus");
      }
    }

    if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      await setPlanByEmail(email, "free");
    }
  } catch (err) {
    console.error("LEMON WEBHOOK ERROR", err);
    return NextResponse.json({ error: "PLAN_UPDATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}