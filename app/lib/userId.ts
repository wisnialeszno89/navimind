import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";

const UID_COOKIE = "navimind_uid";

export function getUserId() {
  const headerStore = headers();
  const headerUid = headerStore.get("x-navimind-uid");

  // 🔥 Jeśli UID przychodzi z frontendu — używamy go
  if (headerUid && headerUid.length > 10) {
    return headerUid;
  }

  const cookieStore = cookies();
  let userId = cookieStore.get(UID_COOKIE)?.value;

  if (!userId) {
    userId = randomUUID();

    cookieStore.set(UID_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return userId;
}