import { NextResponse } from "next/server";

import {
  getAllUsersWithEmail,
  shouldSendRetention,
  markRetentionSent,
} from "../../../lib/retentionStore";

import { sendRetentionEmail } from "../../../lib/retentionEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await getAllUsersWithEmail();

    let sent = 0;

    for (const user of users) {
      const dayToSend = await shouldSendRetention(user.userId);
      if (!dayToSend) continue;

      await sendRetentionEmail(user.email, dayToSend);
      await markRetentionSent(user.userId, dayToSend);

      sent++;
    }

    return NextResponse.json({ ok: true, processed: users.length, sent });
  } catch (err) {
    console.error("RETENTION CRON ERROR:", err);
    return NextResponse.json({ error: "RETENTION_FAILED" }, { status: 500 });
  }
}
