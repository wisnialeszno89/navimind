import { timingSafeEqual } from "node:crypto";

const MAX_TEST_TTL_MS = 2 * 60 * 60 * 1000;

function constantTimeEqual(input: string, configured: string): boolean {
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(configured, "utf8");
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Extra temporary V2-only credential, independent of the production secret.
 * Fail closed when any config item is missing, future-dated, expired,
 * or has a validity window exceeding two hours. This does NOT bypass
 * Vercel Deployment Protection; it only authenticates inside the app.
 */
export function validTemporaryV2Secret(
  supplied: string,
  env: Record<string, string | undefined>,
  now = Date.now(),
): boolean {
  const configured = env.NAVIMIND_AGENT_TEST_SECRET?.trim();
  const issuedString = env.NAVIMIND_AGENT_TEST_ISSUED_AT?.trim();
  const expiresString = env.NAVIMIND_AGENT_TEST_EXPIRES_AT?.trim();
  if (!configured || !issuedString || !expiresString ||
      typeof supplied !== "string" || !Number.isFinite(now)) {
    return false;
  }
  const issued = Date.parse(issuedString);
  const expires = Date.parse(expiresString);
  if (!Number.isFinite(issued) || !Number.isFinite(expires) ||
      expires <= issued || expires - issued > MAX_TEST_TTL_MS ||
      now < issued || now >= expires) {
    return false;
  }
  return constantTimeEqual(supplied, configured);
}
