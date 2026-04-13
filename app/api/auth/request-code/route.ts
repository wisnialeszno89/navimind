import { NextResponse } from "next/server";
import { saveCode } from "../../../lib/auth/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("KV URL:", process.env.KV_REST_API_URL);
    console.log("KV TOKEN:", process.env.KV_REST_API_TOKEN);

    const body = await req.json().catch(() => null);
    const email = body?.email as string | undefined;

    if (!email) {
      return NextResponse.json({ error: "NO_EMAIL" }, { status: 400 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await saveCode(email, code);

    const result = await resend.emails.send({
    from: "NaviMind <hello@navimind.app>",
    to: email,
    subject: "Twój kod logowania",
    html: `<b>${code}</b>`,
  });

console.log("RESEND RESULT:", result);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("REQUEST CODE ERROR:", err);
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }
}