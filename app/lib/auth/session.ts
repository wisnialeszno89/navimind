import { cookies } from "next/headers";
import { createHash } from "crypto";

const SESSION_COOKIE = "navimind_session";
const SESSION_TTL_DAYS = 30;

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  // ✅ w DEV możesz mieć fallback
  if (!secret && process.env.NODE_ENV !== "production") {
    return "dev_navimind_session_secret";
  }

  // ✅ na PROD wymagamy secreta (żeby sesje nie umierały losowo)
  if (!secret) {
    throw new Error("Missing SESSION_SECRET in production environment");
  }

  return secret;
}

function sign(email: string) {
  const secret = getSecret();
  return createHash("sha256").update(email + "|" + secret).digest("hex");
}

export function setSession(email: string) {
  const cookieStore = cookies();
  const value = `${email}::${sign(email)}`;

  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,

    // ✅ jeśli masz subdomeny, ustaw COOKIE_DOMAIN=.twojadomena.pl
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
}

export function clearSession() {
  const cookieStore = cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
}

export function getSessionEmail(): string | null {
  const cookieStore = cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [email, sig] = raw.split("::");
  if (!email || !sig) return null;

  const expected = sign(email);
  if (sig !== expected) return null;

  return email;
}