"use client";

import { useEffect, useState } from "react";
import { PartyPopper, Clock, PauseCircle, X } from "lucide-react";
import { getCurrentUserSession } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const BLUE = "#1E4FD8";
const TRIAL_DURATION_DAYS = 14;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
// Treat the account as "just signed up" if its trial started within this window, so the
// welcome modal shows reliably on first landing regardless of how the browser got to
// /dashboard (redirect, reload, prefetch) instead of depending on a URL query param.
const FRESH_SIGNUP_WINDOW_MS = 5 * 60 * 1000;
const REMINDER_AUTO_DISMISS_MS = 7000;

function daysRemaining(trialStartedAt: string): number {
  const startedAt = new Date(trialStartedAt).getTime();
  if (Number.isNaN(startedAt)) return TRIAL_DURATION_DAYS;
  const remainingMs = TRIAL_DURATION_MS - (Date.now() - startedAt);
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

/**
 * Mounted once in src/app/(app)/layout.tsx, so it lives for the whole app session:
 * - Persistent "N days left" pill, top-right corner of every page.
 * - Full welcome modal, shown once per browser tab right after signup.
 * - Small "welcome back" reminder toast, shown once per browser tab on a returning login.
 */
export function TrialStatus() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [trialEndsLabel, setTrialEndsLabel] = useState<string | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  useEffect(() => {
    let dismissTimer: ReturnType<typeof setTimeout> | undefined;

    getCurrentUserSession().then((session) => {
      if (!session?.trialStartedAt || session.trialExempt) return;

      const trialStartedAt = session.trialStartedAt as string;
      const startedAt = new Date(trialStartedAt).getTime();
      if (Number.isNaN(startedAt)) return;

      setIsPaused(Boolean(session.trialPausedAt));
      setDaysLeft(daysRemaining(trialStartedAt));
      setTrialEndsLabel(
        new Date(startedAt + TRIAL_DURATION_MS).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );

      const isFreshSignup = Date.now() - startedAt < FRESH_SIGNUP_WINDOW_MS;
      const shownKey = isFreshSignup
        ? `erv_welcome_shown_${session.userId}`
        : `erv_trial_reminder_shown_${session.userId}`;
      if (sessionStorage.getItem(shownKey)) return;
      sessionStorage.setItem(shownKey, "1");

      if (isFreshSignup) {
        setWelcomeOpen(true);
      } else {
        setReminderOpen(true);
        dismissTimer = setTimeout(() => setReminderOpen(false), REMINDER_AUTO_DISMISS_MS);
      }
    });

    return () => clearTimeout(dismissTimer);
  }, []);

  return (
    <>
      {/* Persistent trial-days badge, top-right corner of every app page */}
      {daysLeft !== null && (
        <div
          className={cn(
            "fixed top-4 right-4 z-40 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md",
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

      {/* Small "welcome back" reminder toast for returning logins */}
      {reminderOpen && daysLeft !== null && (
        <div className="fixed top-16 right-4 z-40 w-72 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-2 rounded-2xl border border-slate-200 bg-white p-4 pr-8 shadow-xl">
          <button
            onClick={() => setReminderOpen(false)}
            className="absolute right-3 top-3 text-slate-400 transition-colors hover:text-slate-700"
          >
            <X className="size-3.5" />
          </button>
          <p className="text-sm font-bold text-slate-900">Welcome back!</p>
          <p className="mt-1 text-xs text-slate-500">
            {isPaused
              ? "Your trial is currently paused by an admin."
              : `You have ${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your 14-day free trial.`}
          </p>
        </div>
      )}

      {/* Full welcome modal for brand-new signups */}
      {welcomeOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setWelcomeOpen(false)}
              className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1E4FD8]">
                <PartyPopper className="size-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Welcome to the ECO Matrix ERV Tool!
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Your account is ready. You&apos;re all set to start modeling ERV performance.
              </p>

              <div className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left">
                <Clock className="size-5 shrink-0 text-[#1E4FD8]" />
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-900">Your 14-day free trial has started</p>
                  {trialEndsLabel ? (
                    <p className="mt-0.5">You have full access until {trialEndsLabel}.</p>
                  ) : (
                    <p className="mt-0.5">You have full access for the next 14 days.</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setWelcomeOpen(false)}
              className="mt-6 w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </>
  );
}
