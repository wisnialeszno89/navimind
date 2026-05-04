import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";

const UID_COOKIE = "navimind_uid";

export function getUserId() {
  const cookieStore = cookies();
  const headerStore = headers();

  // 🔥 1. NAJPIERW cookie (to jest Twój główny identyfikator)
  let userId = cookieStore.get(UID_COOKIE)?.value;

  if (userId && userId.length > 10) {
    return userId;
  }

  // 🔥 2. fallback na header (jeśli frontend świadomie go wysyła)
  const headerUid = headerStore.get("x-navimind-uid");

  if (headerUid && headerUid.length > 10) {
    return headerUid;
  }

  // 🔥 3. jeśli nic nie ma → generujemy NOWE ID
  userId = randomUUID();

  // ⚠️ ważne: secure tylko na produkcji (bo localhost inaczej nie zapisze cookie)
  cookieStore.set(UID_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 rok
  });

  return userId;
}