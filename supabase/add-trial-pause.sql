-- Adds a pause/resume control for the 14-day trial clock, used by the Admin Portal's
-- "Pause Trial" / "Restart Trial" buttons. Paste into the Supabase SQL editor
-- (Database > SQL Editor > New query) and run it. Safe to re-run.

-- When set, the trial clock is frozen: isTrialExpired() treats the account as not
-- expired regardless of how much time has passed since trial_started_at. Resuming
-- (clearing this column) shifts trial_started_at forward by the paused duration so
-- the user's remaining days pick back up where they left off, instead of resetting
-- or instantly expiring. See src/app/actions/admin.ts: pauseUserTrial / resumeUserTrial.
alter table public.users
  add column if not exists trial_paused_at timestamp with time zone null;
