import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { Buffer } from "buffer";
import { getUserId } from "../../lib/userId";
import { getUserPlan } from "../../lib/userPlan";
import { PLAN_LIMITS } from "../../lib/plans";
import { checkAndIncrementMonthlyUsage } from "../../lib/monthlyUsage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPdfLimits(plan: "free" | "pro" | "pro_plus") {
  if (plan === "pro_plus") {
    return {
      maxPdfSize: 20 * 1024 * 1024,
      maxPages: 40,
    };
  }

  return {
    maxPdfSize: 10 * 1024 * 1024,
    maxPages: 20,
  };
}

export async function POST(req: Request) {
  try {
    const userId = getUserId();
    const plan = await getUserPlan();

    if (plan === "free") {
      return NextResponse.json(
        { error: "PRO_REQUIRED", message: "PDF jest dostępny w wersji PRO." },
        { status: 403 }
      );
    }

    const { maxPdfSize, maxPages } = getPdfLimits(plan);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "NOT_PDF" }, { status: 400 });
    }

    if (file.size > maxPdfSize) {
      return NextResponse.json(
        {
          error: "PDF_TOO_LARGE",
          message:
            plan === "pro_plus"
              ? "Maksymalny rozmiar PDF to 20 MB (PRO+)."
              : "Maksymalny rozmiar PDF to 10 MB (PRO).",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);

    if (data.numpages > maxPages) {
      return NextResponse.json(
        {
          error: "PDF_TOO_LONG",
          message:
            plan === "pro_plus"
              ? `Maksymalnie ${maxPages} stron w jednym PDF (PRO+).`
              : `Maksymalnie ${maxPages} stron w jednym PDF (PRO).`,
        },
        { status: 400 }
      );
    }

    const text = data.text
      ?.replace(/\n{3,}/g, "\n\n")
      ?.replace(/[ \t]+\n/g, "\n")
      ?.trim();

    if (!text) {
      return NextResponse.json({ error: "EMPTY_PDF" }, { status: 400 });
    }

    const pdfLimit = PLAN_LIMITS[plan].monthlyPdf;

    const pdfLimitRes = await checkAndIncrementMonthlyUsage(
      userId,
      "pdf",
      pdfLimit
    );

    if (!pdfLimitRes.allowed) {
      return NextResponse.json(
        {
          error: "PDF_LIMIT_REACHED",
          message:
            plan === "pro_plus"
              ? "Osiągnięto limit PDF w tym miesiącu (PRO+)."
              : "Osiągnięto limit PDF w tym miesiącu (PRO).",
          limit: pdfLimitRes,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      text,
      meta: {
        name: file.name,
        pages: data.numpages,
        plan,
        maxPdfSize,
        maxPages,
        pdfThisMonth: pdfLimitRes.used,
        pdfRemaining: pdfLimitRes.remaining,
        pdfResetAt: pdfLimitRes.resetAt,
      },
    });
  } catch (e) {
    console.error("PDF UPLOAD ERROR:", e);
    return NextResponse.json({ error: "PDF_PARSE_FAILED" }, { status: 500 });
  }
}