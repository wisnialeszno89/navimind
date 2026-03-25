import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCurrentLimit } from "../../lib/chatLimit";
import { getUserId } from "../../lib/userId";

export async function GET() {
  try {
    const headerStore = headers();
    const headerUid = headerStore.get("x-navimind-uid");

    const userId =
      headerUid && headerUid.length > 10
        ? headerUid
        : getUserId();

    const limitData = await getCurrentLimit(userId);

    return NextResponse.json(limitData, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Limit API error:", error);

    return NextResponse.json(
      {
        allowed: false,
        used: 0,
        remaining: 0,
        limit: 0,
        resetAt: Date.now(),
      },
      { status: 500 }
    );
  }
}