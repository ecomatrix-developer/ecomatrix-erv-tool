-- Fixes projects.owner_id to reference public.users instead of the old auth.users
-- (leftover from an earlier version of schema.sql run before custom auth was added).
-- Safe to run even with existing rows in projects, as long as every existing
-- owner_id already matches a public.users.id (it does -- the table is currently empty
-- except for whatever you've created since the app started working).

alter table public.projects
  drop constraint if exists projects_owner_id_fkey;

alter table public.projects
  add constraint projects_owner_id_fkey
  foreign key (owner_id) references public.users (id) on delete cascade;
