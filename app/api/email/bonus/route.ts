import { NextResponse } from "next/server";
import { getUserId } from "../../../lib/userId";
import { grantEmailBonus, hasUsedEmailBonus } from "../../../lib/emailBonus";

export async function POST() {
  const userId = getUserId();

  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const already = await hasUsedEmailBonus(userId);

  if (already) {
    return NextResponse.json({ ok: true, bonus: 0, already: true });
  }

  const bonus = await grantEmailBonus(userId);

  return NextResponse.json({ ok: true, bonus, already: false });
}
