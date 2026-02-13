import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const UID_COOKIE = "navimind_uid";

export function getUserId() {
  const cookieStore = cookies();
  let userId = cookieStore.get(UID_COOKIE)?.value;

  if (!userId) {
    userId = randomUUID();

    cookieStore.set(UID_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 rok
    });
  }

  return userId;
}