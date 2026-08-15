-- Adds storage for user-uploaded .epw weather files, so a parsed EPW can be reused
-- across projects/scenarios instead of re-uploading every time. Same ownership
-- pattern as projects/scenarios: RLS enabled with no policies (only the server-role
-- client, gated by the app's session cookie, can read/write).

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

alter table public.custom_weather_files enable row level security;
