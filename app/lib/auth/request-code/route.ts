import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email as string | undefined;

    if (!email) {
      return NextResponse.json({ error: "NO_EMAIL" }, { status: 400 });
    }

    /* 🔥 runtime-only Resend (naprawia build) */
    const { Resend } = await import("resend");

    const resend = new Resend(process.env.RESEND_API_KEY);

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // tutaj pewnie masz zapis kodu do KV / DB — zostawiam bez zmian
    // await saveCode(email, code);

    await resend.emails.send({
      from: "NaviMind <no-reply@navimind.app>",
      to: email,
      subject: "Twój kod logowania",
      html: `
        <div style="font-family:sans-serif">
          <h2>Twój kod:</h2>
          <p style="font-size:24px;letter-spacing:4px"><b>${code}</b></p>
          <p>Kod jest ważny przez kilka minut.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("REQUEST CODE ERROR:", err);
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }
}
