import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResend();

  if (!client) return; // brak klucza = brak wysyłki (bez crasha)

  try {
    await client.emails.send({
      from: "NaviMind <kontakt@navimind.app>",
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error("EMAIL_SEND_ERROR:", e);
  }
}
