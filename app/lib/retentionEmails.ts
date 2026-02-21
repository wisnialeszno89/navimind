import { Resend } from "resend";
import type { RetentionDay } from "./retentionStore";

const resend = new Resend(process.env.RESEND_API_KEY!);

function buildContent(day: RetentionDay) {
  if (day === 1) {
    return {
      subject: "Wczoraj zaczęliśmy rozmowę…",
      text: "Jeśli chcesz, możemy wrócić do niej dziś. NaviMind czeka.",
    };
  }

  if (day === 3) {
    return {
      subject: "Nie musisz wszystkiego ogarniać sam",
      text: "Czasem wystarczy jedna spokojna rozmowa. Jestem tu.",
    };
  }

  if (day === 7) {
    return {
      subject: "Minął tydzień",
      text: "Możemy zrobić mały krok dalej. Bez presji.",
    };
  }

  if (day === 14) {
    return {
      subject: "Cisza też coś mówi",
      text: "Jeśli wrócisz — zaczniemy spokojnie od miejsca, w którym skończyliśmy.",
    };
  }

  return {
    subject: "Drzwi są nadal otwarte",
    text: "NaviMind jest tu, kiedy będziesz gotowy wrócić.",
  };
}

export async function sendRetentionEmail(email: string, day: RetentionDay) {
  const { subject, text } = buildContent(day);

  await resend.emails.send({
    from: "NaviMind <kontakt@navimind.app>",
    to: email,
    subject,
    text,
  });
}
