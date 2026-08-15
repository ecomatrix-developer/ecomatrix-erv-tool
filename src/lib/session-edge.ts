import { jwtVerify } from "jose";

/**
 * Proxy-safe session verification: proxy.ts can't import next/headers' cookies()
 * (it reads from the NextRequest directly instead), so this mirrors the decrypt
 * logic in src/lib/session.ts without the "server-only" cookie-store dependency.
 */
export async function verifySessionCookie(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = "session";
