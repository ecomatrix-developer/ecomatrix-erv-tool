import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const TRIAL_DURATION_DAYS = 14;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

function encodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role?: string;
  /** ISO timestamp the account's 14-day trial started (== users.trial_started_at). */
  trialStartedAt: string;
  /** Accounts exempt from the trial clock (e.g. admin). */
  trialExempt: boolean;
  /** ISO timestamp the trial clock was paused at by an admin, or null if running (== users.trial_paused_at). */
  trialPausedAt: string | null;
  [key: string]: unknown;
}

async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey());
}

async function decrypt(session: string | undefined): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey(), { algorithms: ["HS256"] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Mirrors the check in src/lib/session-edge.ts, kept in sync by hand since that
 * file can't import "server-only" code. */
export function isTrialExpired(
  payload: Pick<SessionPayload, "trialStartedAt" | "trialExempt" | "trialPausedAt">,
): boolean {
  if (payload.trialExempt || payload.trialPausedAt) return false;
  const startedAt = new Date(payload.trialStartedAt).getTime();
  if (Number.isNaN(startedAt)) return false;
  return Date.now() - startedAt > TRIAL_DURATION_MS;
}

export function trialDaysRemaining(trialStartedAt: string): number {
  const startedAt = new Date(trialStartedAt).getTime();
  if (Number.isNaN(startedAt)) return 0;
  const remainingMs = TRIAL_DURATION_MS - (Date.now() - startedAt);
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

export async function createSession(
  userId: string,
  email: string,
  role = "user",
  trialStartedAt: string,
  trialExempt = false,
  trialPausedAt: string | null = null,
) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await encrypt({ userId, email, role, trialStartedAt, trialExempt, trialPausedAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const payload = await decrypt(cookieStore.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  // Belt-and-suspenders: proxy.ts already redirects expired-trial sessions away
  // from protected routes, but any direct server-action caller gets the same check.
  if (isTrialExpired(payload)) return null;
  return payload;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** For use in proxy.ts, which cannot import "server-only" code that touches next/headers cookies() directly. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  return decrypt(token);
}

export { SESSION_COOKIE };
