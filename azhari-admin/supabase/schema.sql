-- ============================================================================
-- أزهري وأفتخر — Supabase schema
-- Run this once in the Supabase SQL editor on a fresh project.
-- Security model: Row Level Security is the real access-control boundary,
-- not the Next.js app. Every table below has RLS enabled and every policy
-- is written so that even a client that bypasses the UI entirely (calls
-- supabase-js directly from devtools) still can't see or change data it
-- shouldn't. The app's client-side route guards are a UX convenience on
-- top of this, not the security layer itself.
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Exactly one row will ever exist here (enforced by trigger below).
-- Membership is the sole definition of "admin" — the app never lets anyone
-- add themselves; you add the one admin manually via SQL after they sign up.
create table admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table students (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  registration_number text not null unique,
  full_name           text not null,
  national_id         text not null unique,
  phone               text not null unique,
  email               text not null,
  governorate         text not null,
  city                text not null,
  date_of_birth       date not null,
  gender              text not null check (gender in ('MALE','FEMALE')),
  memorization_level  text not null,
  educational_stage   text not null,
  institute            text not null,
  approval_status     text not null default 'PENDING' check (approval_status in ('PENDING','APPROVED','REJECTED')),
  rejection_reason    text,
  exam_date           date,
  exam_time           text,
  exam_place          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table scores (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null unique references students(id) on delete cascade,
  tajweed            numeric not null default 0 check (tajweed between 0 and 25),
  memorization        numeric not null default 0 check (memorization between 0 and 40),
  voice              numeric not null default 0 check (voice between 0 and 20),
  performance        numeric not null default 0 check (performance between 0 and 15),
  final              numeric not null default 0,   -- computed by trigger, not the client
  status             text not null default 'PENDING' check (status in ('PENDING','PASSED','FAILED')),
  rank               integer,                       -- computed by trigger, not the client
  updated_at         timestamptz not null default now()
);

-- Singleton settings row. "id" is always 'singleton' — the app never creates
-- a second row (enforced by primary key + the app only ever upserts this id).
create table settings (
  id                  text primary key default 'singleton',
  registration_open   boolean not null default true,
  results_published   boolean not null default false, -- <-- the single publish/hide toggle
  announcement        text not null default '',
  about_text          text not null default '',
  updated_at          timestamptz not null default now()
);

insert into settings (id) values ('singleton') on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Helper: is_admin()
-- SECURITY DEFINER + created by the project owner (the default when you run
-- this in the Supabase SQL editor) means this function runs with privileges
-- that bypass RLS on the admins table — this is the standard, documented
-- Supabase pattern for writing a role-check helper without recursive RLS
-- issues. Every other table's policies call this instead of querying
-- `admins` directly.
-- ----------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- Hard-enforce "exactly one admin, ever, only added by you"
-- ----------------------------------------------------------------------------
create or replace function prevent_second_admin()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from admins) >= 1 then
    raise exception 'Only one admin is allowed. Delete the existing admin row first if you need to change it.';
  end if;
  return new;
end;
$$;

create trigger trg_single_admin
before insert on admins
for each row execute function prevent_second_admin();

-- ----------------------------------------------------------------------------
-- Students: force safe defaults server-side, never trust the client for these
-- ----------------------------------------------------------------------------
create or replace function students_before_insert()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();          -- you can only ever register yourself
  new.approval_status := 'PENDING';   -- you can never self-approve
  new.rejection_reason := null;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_students_before_insert
before insert on students
for each row execute function students_before_insert();

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_students_updated_at
before update on students
for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Scores: final score + pass/fail computed server-side (never trust a client
-- -submitted "final" value), rank recomputed after any change.
-- ----------------------------------------------------------------------------
create or replace function scores_before_write()
returns trigger
language plpgsql
as $$
begin
  new.final := coalesce(new.tajweed,0) + coalesce(new.memorization,0) + coalesce(new.voice,0) + coalesce(new.performance,0);
  new.status := case when new.final >= 60 then 'PASSED' else 'FAILED' end;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_scores_before_write
before insert or update on scores
for each row execute function scores_before_write();

create or replace function recompute_ranks()
returns trigger
language plpgsql
as $$
begin
  update scores s
  set rank = ranked.rn
  from (
    select id, row_number() over (order by final desc, updated_at asc) as rn
    from scores
  ) ranked
  where ranked.id = s.id and (s.rank is distinct from ranked.rn);
  return null;
end;
$$;

-- Statement-level trigger avoids row-trigger recursion when this function
-- itself updates the `scores` table.
create trigger trg_recompute_ranks
after insert or update or delete on scores
for each statement execute function recompute_ranks();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table admins   enable row level security;
alter table students enable row level security;
alter table scores   enable row level security;
alter table settings enable row level security;

-- admins: you can check your own membership; nobody can insert/update/delete
-- via the API (no policies for those actions == denied by default). The
-- table is only ever changed by you, running SQL directly in Supabase.
create policy "self can check own admin row"
  on admins for select
  using (user_id = auth.uid());

-- students -------------------------------------------------------------
create policy "admin sees all students"
  on students for select
  using (is_admin());

create policy "student sees only their own row"
  on students for select
  using (user_id = auth.uid());

create policy "anyone authenticated can register once"
  on students for insert
  with check (auth.uid() is not null);
  -- (user_id/approval_status are overwritten server-side by the trigger above
  --  regardless of what's submitted, so this can't be used to impersonate
  --  someone else or self-approve)

create policy "only admin can edit students"
  on students for update
  using (is_admin());

create policy "only admin can delete students"
  on students for delete
  using (is_admin());

-- scores -----------------------------------------------------------------
create policy "admin sees all scores"
  on scores for select
  using (is_admin());

create policy "student sees own score only when results are published"
  on scores for select
  using (
    exists (
      select 1 from students s
      where s.id = scores.student_id
        and s.user_id = auth.uid()
    )
    and (select results_published from settings where id = 'singleton') = true
  );

create policy "only admin writes scores"
  on scores for insert
  with check (is_admin());

create policy "only admin updates scores"
  on scores for update
  using (is_admin());

create policy "only admin deletes scores"
  on scores for delete
  using (is_admin());

-- settings -----------------------------------------------------------------
-- Readable by anyone (including anonymous visitors) so the public homepage
-- can show "registration open" / the announcement without logging in.
create policy "settings are publicly readable"
  on settings for select
  using (true);

create policy "only admin updates settings"
  on settings for update
  using (is_admin());

-- ----------------------------------------------------------------------------
-- Grants
-- RLS policies only filter *which rows* a query can see/touch — Postgres
-- still requires the base table-level privilege to attempt the operation at
-- all. Tables created via the SQL editor (as opposed to the Supabase
-- dashboard's table UI) don't get this automatically, so without the grants
-- below every single query from the app would fail with "permission denied"
-- regardless of how correct the RLS policies above are.
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on admins to authenticated;
grant select, insert, update, delete on students to authenticated;
grant select, insert, update, delete on scores to authenticated;
grant select on settings to anon, authenticated;
grant update on settings to authenticated;

-- ----------------------------------------------------------------------------
-- next_registration_number()
-- A registering student can't COUNT(*) all students themselves — the RLS
-- policy on `students` only ever shows them their own row (by design, so
-- one applicant can't enumerate others). This SECURITY DEFINER function
-- exposes only an aggregate count, never row data, so the register page can
-- still generate a friendly sequential number without weakening RLS.
-- ----------------------------------------------------------------------------
create or replace function next_registration_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yr  text := to_char(now(), 'YYYY');
  cnt integer;
begin
  select count(*) into cnt from students where registration_number like ('AZH-' || yr || '-%');
  return 'AZH-' || yr || '-' || lpad((cnt + 1)::text, 6, '0');
end;
$$;

grant execute on function next_registration_number() to authenticated;

-- ----------------------------------------------------------------------------
-- Helpful indexes
-- ----------------------------------------------------------------------------
create index idx_students_approval_status on students(approval_status);
create index idx_students_governorate on students(governorate);
create index idx_scores_final on scores(final desc);
