"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, PauseCircle, X } from "lucide-react";
import { getTrialStatus } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const TRIAL_DURATION_DAYS = 14;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
const WELCOME_AUTO_DISMISS_MS = 6000;
// Recompute the badge on this interval so it stays accurate across a long-lived tab
// (this component stays mounted across client-side navigation) and picks up an
// admin's trial_started_at/trial_exempt/trial_paused_at edits without a re-login.
const REFRESH_INTERVAL_MS = 60 * 1000;

function daysRemaining(trialStartedAt: string): number {
  const startedAt = new Date(trialStartedAt).getTime();
  if (Number.isNaN(startedAt)) return TRIAL_DURATION_DAYS;
  const remainingMs = TRIAL_DURATION_MS - (Date.now() - startedAt);
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

/**
 * Mounted once in src/app/(app)/layout.tsx, so it lives for the whole app session:
 * - Persistent "N days left" pill, top-right corner of every page (skipped for
 *   trial_exempt accounts, since there's no countdown to show them).
 * - "Welcome, {email}" toast, shown every time a login/signup redirect lands here
 *   with ?welcome=1 (set by every successful redirect in src/app/actions/auth.ts).
 *   Auto-dismisses, but can be closed immediately too.
 */
export function TrialStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [welcomeEmail, setWelcomeEmail] = useState<string | null>(null);

  useEffect(() => {
    function applyBadge(status: Awaited<ReturnType<typeof getTrialStatus>>) {
      if (!status || status.trialExempt) return;
      setIsPaused(Boolean(status.trialPausedAt));
      setDaysLeft(daysRemaining(status.trialStartedAt));
    }

    const showWelcome = searchParams.get("welcome") === "1";

    getTrialStatus().then((status) => {
      applyBadge(status);
      if (showWelcome && status) {
        setWelcomeEmail(status.email);
      }
    });

    if (showWelcome) {
      // Strip ?welcome=1 immediately so a refresh or back-navigation doesn't re-show it.
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      router.replace(url.pathname + url.search);
    }

    const interval = setInterval(() => {
      getTrialStatus().then(applyBadge);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
    // Only re-run for an actual new ?welcome=1 landing, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!welcomeEmail) return;
    const timer = setTimeout(() => setWelcomeEmail(null), WELCOME_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [welcomeEmail]);

  return (
    <>
      {/* Persistent trial-days badge, top-right corner of every app page. Pushed
       * down on small screens so it clears the sticky mobile nav bar (h-14). */}
      {daysLeft !== null && (
        <div
          className={cn(
            "fixed top-[4.5rem] right-3 z-40 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md sm:right-4 lg:top-4",
            isPaused
              ? "border-amber-200 bg-amber-50/95 text-amber-600"
              : daysLeft <= 3
                ? "border-red-200 bg-red-50/95 text-red-600"
                : "border-blue-200 bg-blue-50/95 text-[#1E4FD8]",
          )}
        >
          {isPaused ? <PauseCircle className="size-3.5" /> : <Clock className="size-3.5" />}
          {isPaused
            ? "Trial paused"
            : daysLeft === 0
              ? "Trial ends today"
              : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in trial`}
        </div>
      )}

      {/* "Welcome, {email}" toast -- shown every time a login/signup lands with ?welcome=1 */}
      {welcomeEmail && (
        <div className="fixed top-[7.5rem] right-3 z-40 w-80 max-w-[calc(100vw-1.5rem)] animate-in fade-in slide-in-from-top-2 rounded-2xl border border-slate-200 bg-white p-4 pr-9 shadow-xl sm:right-4 lg:top-16">
          <button
            onClick={() => setWelcomeEmail(null)}
            aria-label="Dismiss"
            className="absolute right-3 top-3 text-slate-400 transition-colors hover:text-slate-700"
          >
            <X className="size-3.5" />
          </button>
          <p className="text-sm font-bold text-slate-900 break-all">Welcome, {welcomeEmail}</p>
        </div>
      )}
    </>
  );
}
