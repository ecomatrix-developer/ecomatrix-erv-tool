-- Adds email-only signup/sign-in + 14-day trial tracking to the existing
-- public.users table. Paste into the Supabase SQL editor (Database > SQL Editor >
-- New query) and run it. Safe to re-run (every statement is idempotent).

-- Self-serve users created from the "Launch ERV Tool" flow have no password at all,
-- so password_hash can no longer be required.
alter table public.users
  alter column password_hash drop not null;

-- Timestamp of first sign-up, used to compute the 14-day trial window. Defaults to
-- now() for new rows; existing rows are backfilled from created_at below.
alter table public.users
  add column if not exists trial_started_at timestamp with time zone not null default timezone('utc'::text, now());

update public.users
  set trial_started_at = created_at
  where trial_started_at is distinct from created_at;

-- Accounts flagged trial_exempt never get locked out after 14 days (internal /
-- admin / VIP accounts).
alter table public.users
  add column if not exists trial_exempt boolean not null default false;

-- Keep the existing root admin account (password-based, used by the Admin Portal)
-- exempt from the trial clock.
update public.users
  set trial_exempt = true
  where email = 'admin@gmail.com';
