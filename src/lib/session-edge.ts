import { jwtVerify } from "jose";

/**
 * Proxy-safe session verification: proxy.ts can't import next/headers' cookies()
 * (it reads from the NextRequest directly instead), so this mirrors the decrypt
 * logic in src/lib/session.ts without the "server-only" cookie-store dependency.
 */
export interface EdgeSessionPayload {
  userId: string;
  email: string;
  role?: string;
  trialStartedAt?: string;
  trialExempt?: boolean;
  trialPausedAt?: string | null;
}

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export async function verifySessionCookie(token: string | undefined): Promise<EdgeSessionPayload | null> {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return payload as unknown as EdgeSessionPayload;
  } catch {
    return null;
  }
}

/** Mirrors isTrialExpired in src/lib/session.ts. */
export function isTrialExpired(payload: EdgeSessionPayload): boolean {
  if (payload.trialExempt || payload.trialPausedAt) return false;
  if (!payload.trialStartedAt) return false;
  const startedAt = new Date(payload.trialStartedAt).getTime();
  if (Number.isNaN(startedAt)) return false;
  return Date.now() - startedAt > TRIAL_DURATION_MS;
}

export const SESSION_COOKIE = "session";
