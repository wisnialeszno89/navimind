import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/userId";
import {
  grantEmailBonus,
  hasUsedEmailBonus,
} from "../../../lib/emailBonus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const already = await hasUsedEmailBonus(userId);

    if (already) {
      return NextResponse.json({
        ok: true,
        bonus: 0,
        already: true,
      });
    }

    const bonus = await grantEmailBonus(userId);

    return NextResponse.json({
      ok: true,
      bonus,
      already: false,
    });
  } catch (error) {
    console.error("EMAIL BONUS ERROR:", error);

    return NextResponse.json(
      { error: "BONUS_FAILED" },
      { status: 500 }
    );
  }
}