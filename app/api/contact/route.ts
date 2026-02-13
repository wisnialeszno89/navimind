import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();

    if (!message) {
      return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "RESEND_NOT_CONFIGURED",
          message: "Brak konfiguracji maila (RESEND_API_KEY).",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const from = "NaviMind <onboarding@resend.dev>";
    const to = process.env.CONTACT_EMAIL || "twojmail@domain.com";

    await resend.emails.send({
      from,
      to,
      subject: "NaviMind — wiadomość z formularza kontaktowego",
      text: `Nowa wiadomość:\n\nImię: ${name || "-"}\nEmail: ${
        email || "-"
      }\n\nTreść:\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("CONTACT API ERROR:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}