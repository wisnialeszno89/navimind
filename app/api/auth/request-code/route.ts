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
    html: `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:20px">
    
    <h2 style="margin-bottom:10px">Twój kod logowania</h2>
    
    <p style="font-size:14px;color:#555">
      Użyj poniższego kodu, aby zalogować się do NaviMind:
    </p>

    <div style="
      font-size:28px;
      letter-spacing:6px;
      font-weight:bold;
      text-align:center;
      margin:20px 0;
    ">
      ${code}
    </div>

    <p style="font-size:13px;color:#777">
      Kod jest ważny przez <b>10 minut</b>.
    </p>

    <p style="font-size:13px;color:#aaa;margin-top:20px">
      Jeśli to nie Ty próbowałeś się zalogować, zignoruj tę wiadomość.
    </p>

  </div>
`});

console.log("RESEND RESULT:", result);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("REQUEST CODE ERROR:", err);
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }
}