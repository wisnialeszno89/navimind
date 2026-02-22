import { Resend } from "resend";

export async function sendRetentionEmail(email: string, day: number) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Missing RESEND_API_KEY — skipping email send");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject =
    day === 3
      ? "Wracasz?"
      : day === 7
      ? "Jeszcze tu jestem."
      : "NaviMind";

  const text =
    day === 3
      ? "Minęło kilka dni. Jeśli chcesz wrócić — jestem."
      : day === 7
      ? "Czasem wraca się wtedy, gdy jest się gotowym."
      : "To tylko przypomnienie, że możesz wrócić.";

  await resend.emails.send({
    from: "NaviMind <hello@navimind.app>",
    to: email,
    subject,
    text,
  });
}