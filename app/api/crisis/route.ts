import { NextResponse } from "next/server";

export const runtime = "edge";

/* =========================
   TYPES
   ========================= */

type Level = "none" | "low" | "medium" | "high";

/* =========================
   DETECTION
   ========================= */

function detectCrisis(text: string): Level {
  const t = text.toLowerCase();

  // 🔴 HIGH — realne zagrożenie
  if (
    /(nie chcę żyć|chcę umrzeć|zabić się|samobój|koniec ze mną|nie ma sensu żyć)/i.test(
      t
    )
  ) {
    return "high";
  }

  // 🟠 MEDIUM — silna rozpacz
  if (
    /(nie daję rady|wszystko mnie przerasta|jest bez sensu|nic nie ma sensu)/i.test(
      t
    )
  ) {
    return "medium";
  }

  // 🟡 LOW — smutek / napięcie
  if (/(jest mi źle|smutno|ciężko mi|boję się|stresuję się)/i.test(t)) {
    return "low";
  }

  return "none";
}

/* =========================
   ROUTE
   ========================= */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const text: string = body?.message ?? "";

    const level = detectCrisis(text);

    return NextResponse.json({
      level,
    });
  } catch {
    return NextResponse.json(
      { level: "none" },
      { status: 200 }
    );
  }
}
