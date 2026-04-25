-- TravelAI - Phase 1 schema (profiles, trips) + RLS
-- Assumes Supabase Auth schema exists (auth.users).

create extension if not exists pgcrypto;

-- Profiles: one row per authenticated user
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  edu_email text unique not null,
  university_name text,
  points integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Trips: minimal MVP persistence (itinerary stored as JSONB)
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  origin text,
  destination text,
  city_name text,
  duration_days integer,
  budget_limit numeric,
  total_budget_est numeric,
  visa_info text,
  itinerary_data jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create index if not exists trips_user_id_created_at_idx
  on public.trips (user_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.trips enable row level security;

-- profiles policies
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- trips policies
drop policy if exists trips_select_own on public.trips;
create policy trips_select_own
  on public.trips
  for select
  using (auth.uid() = user_id);

drop policy if exists trips_insert_own on public.trips;
create policy trips_insert_own
  on public.trips
  for insert
  with check (auth.uid() = user_id);

drop policy if exists trips_update_own on public.trips;
create policy trips_update_own
  on public.trips
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists trips_delete_own on public.trips;
create policy trips_delete_own
  on public.trips
  for delete
  using (auth.uid() = user_id);

