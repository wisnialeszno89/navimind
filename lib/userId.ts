import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export function getUserId() {
  const cookieStore = cookies();
  let userId = cookieStore.get("navimind_uid")?.value;

  if (!userId) {
    userId = randomUUID();
    cookieStore.set("navimind_uid", userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return userId;
}