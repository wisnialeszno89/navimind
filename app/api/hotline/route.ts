import { NextResponse } from "next/server";

export const runtime = "edge";

/* =========================
   HOTLINES DB
   ========================= */

type Hotline = {
  name: string;
  phone: string;
  note?: string;
};

const HOTLINES: Record<string, Hotline> = {
  PL: {
    name: "Linia wsparcia 24/7",
    phone: "116 123",
    note: "Bezpłatna pomoc kryzysowa",
  },
  DE: {
    name: "TelefonSeelsorge",
    phone: "0800 111 0 111",
  },
  UK: {
    name: "Samaritans",
    phone: "116 123",
  },
  US: {
    name: "988 Suicide & Crisis Lifeline",
    phone: "988",
  },
};

/* =========================
   COUNTRY DETECTION
   ========================= */

function getCountry(req: Request): string {
  // Vercel header
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "PL";

  return country.toUpperCase();
}

/* =========================
   ROUTE
   ========================= */

export async function GET(req: Request) {
  try {
    const country = getCountry(req);

    const hotline = HOTLINES[country] ?? HOTLINES["PL"];

    return NextResponse.json({
      country,
      hotline,
    });
  } catch {
    return NextResponse.json(
      {
        country: "PL",
        hotline: HOTLINES["PL"],
      },
      { status: 200 }
    );
  }
}
