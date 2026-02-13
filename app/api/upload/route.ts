import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getUserPlan } from "../../lib/userPlan";
import { getUserId } from "../../lib/userId";
import { PLAN_LIMITS } from "../../lib/plans";
import { checkAndIncrementMonthlyUsage } from "../../lib/monthlyUsage";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 1_000_000; // 1MB

export async function POST(req: Request) {
  try {
    const plan = await getUserPlan();

    if (plan === "free") {
      return NextResponse.json(
        { error: "PRO_REQUIRED", message: "Upload zdjęć jest w PRO." },
        { status: 403 }
      );
    }

    const userId = getUserId();

    // ✅ limit miesięczny uploadów zdjęć (liczymy jako "image")
    const imageLimit = PLAN_LIMITS[plan].monthlyImages;
    const usage = await checkAndIncrementMonthlyUsage(
      userId,
      "image",
      imageLimit
    );

    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "IMAGE_LIMIT_REACHED",
          message:
            plan === "pro_plus"
              ? "Osiągnięto limit zdjęć w tym miesiącu (PRO+)."
              : "Osiągnięto limit zdjęć w tym miesiącu (PRO).",
          limit: usage,
        },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "INVALID_FILE" }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "IMAGE_TOO_LARGE", message: "Max 1 MB." },
        { status: 400 }
      );
    }

    // ✅ upload do Blob
    const ext = file.name.split(".").pop() || "png";
    const safeName = `navimind/${crypto.randomUUID()}.${ext}`;

    const blob = await put(safeName, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      contentType: file.type,
      name: file.name,
      size: file.size,
      meta: {
        plan,
        imagesThisMonth: usage.used,
        imagesRemaining: usage.remaining,
        imagesResetAt: usage.resetAt,
      },
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}