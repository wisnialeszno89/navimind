import { NextResponse } from "next/server";
import { verifyCode } from "../../../lib/auth/codes";
import { createHash } from "crypto";
import { setSession } from "../../../lib/auth/session";

export const runtime = "nodejs";

const SESSION_COOKIE = "navimind_session";
const SESSION_TTL_DAYS = 30;

function sign(email: string) {
  const secret = process.env.SESSION_SECRET || "navimind_session_secret";
  return createHash("sha256").update(email + "|" + secret).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();

    console.log("VERIFY EMAIL:", email);
    console.log("VERIFY CODE:", code);

    if (!email || !email.includes("@") || code.length < 4) {
      return NextResponse.json({ error: "INVALID_DATA" }, { status: 400 });
    }

    const ok = await verifyCode(email, code);

    if (!ok) {
      return NextResponse.json({ error: "INVALID_CODE" }, { status: 401 });
    }

    setSession(email);

const res = NextResponse.json({ ok: true });

res.cookies.set("nm_email", email, {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
});

return res;

return res;
  } catch (e) {
    console.error("VERIFY CODE ERROR:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}