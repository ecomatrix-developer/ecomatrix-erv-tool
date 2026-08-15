-- ERV Energy Savings Calculator -- schema for the custom users table, saved
-- projects & scenarios. Paste into the Supabase SQL editor (Database > SQL Editor >
-- New query) and run it.
--
-- This app uses its OWN users table + a signed session cookie (see src/lib/session.ts)
-- instead of Supabase Auth, so RLS cannot key off auth.uid() -- there is no Supabase
-- Auth session. All access control for projects/scenarios is instead enforced in
-- application code (Server Actions check the session and filter by owner_id) using
-- the service-role client (src/lib/supabase/admin.ts). RLS stays enabled as a
-- defense-in-depth backstop that denies the anon/public key entirely; only the
-- server-side service role key (never exposed to the browser) can read/write here.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid not null default gen_random_uuid (),
  email text not null,
  password_hash text not null,
  full_name text null,
  is_active boolean null default true,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  last_login timestamp with time zone null,
  password_changed_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
);

-- One row per named project a user creates from the "Enter project name" modal.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on public.projects (owner_id);

-- One row per scenario (BaseCase, Option 1..4) run within a project. `inputs` mirrors
-- ScenarioInputsPayload (src/lib/calc-engine/request.ts) and `outputs` mirrors
-- ScenarioOutputs (src/lib/calc-engine/types.ts), stored as JSONB so the calc engine's
-- field set can evolve without a migration for every new input/output field.
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  position smallint not null,
  inputs jsonb not null,
  outputs jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, position)
);

create index if not exists scenarios_project_id_idx on public.scenarios (project_id);

-- User-uploaded .epw weather files, saved so a parsed EPW can be reused across
-- projects/scenarios without re-uploading every time.
create table if not exists public.custom_weather_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,               -- location name extracted from the EPW LOCATION header
  source_filename text not null,    -- original uploaded filename, for display/reference
  dbt jsonb not null,               -- dry-bulb temperature, degC, 8760 hourly values
  rh jsonb not null,                -- relative humidity, %, 8760 hourly values
  created_at timestamptz not null default now()
);

create index if not exists custom_weather_files_owner_id_idx on public.custom_weather_files (owner_id);

-- Keep updated_at current on every row change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists set_scenarios_updated_at on public.scenarios;
create trigger set_scenarios_updated_at
  before update on public.scenarios
  for each row execute function public.set_updated_at();

-- RLS enabled with no policies defined: the anon/public API key (used nowhere in this
-- app, but still theoretically reachable via PostgREST) gets zero access. Only the
-- service-role key -- which bypasses RLS and is only ever used server-side in Server
-- Actions that check the session cookie -- can read or write these tables.
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.scenarios enable row level security;
alter table public.custom_weather_files enable row level security;

-- Seed the one fixed account. Password: Ecomatrix@2026 (bcrypt hash below, cost 10,
-- generated with bcryptjs to match src/app/actions/auth.ts's compare call). The app
-- never writes to password_hash except via this seed, since signup is disabled.
insert into public.users (email, password_hash, full_name)
values (
  'ervtool.ecomatrix@gmail.com',
  '$2b$10$1SaEBjH1QMTy1VCqge33ge97ngJqgR3kRDE9Ya2efyjuc5gQLIkAu',
  'Eco Matrix ERV Tool'
)
on conflict (email) do nothing;
