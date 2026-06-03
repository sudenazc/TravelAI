-- TravelAI - Phase 4 schema: local helpers + bookings (Epic 6)

-- ─── 1. Extend profiles with local helper fields ───────────────────────────

alter table public.profiles
  add column if not exists is_local_helper  boolean not null default false,
  add column if not exists helper_region    text,
  add column if not exists helper_bio       text,
  add column if not exists helper_availability text;

create index if not exists profiles_local_helper_region_idx
  on public.profiles (helper_region)
  where is_local_helper = true;

-- ─── 2. local_bookings table ───────────────────────────────────────────────
-- Payment columns deferred to Phase 2 (payment integration).

create table if not exists public.local_bookings (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  helper_id     uuid not null references public.profiles (id) on delete cascade,
  trip_id       uuid references public.trips (id) on delete set null,
  message       text,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamp with time zone not null default now(),
  constraint no_self_booking check (requester_id <> helper_id)
);

create index if not exists local_bookings_requester_idx on public.local_bookings (requester_id);
create index if not exists local_bookings_helper_idx    on public.local_bookings (helper_id);
create index if not exists local_bookings_status_idx    on public.local_bookings (status);

-- ─── 3. RLS ────────────────────────────────────────────────────────────────

alter table public.local_bookings enable row level security;

-- Requester or helper can read their own bookings
drop policy if exists local_bookings_select_own on public.local_bookings;
create policy local_bookings_select_own
  on public.local_bookings
  for select
  using (requester_id = auth.uid() or helper_id = auth.uid());

-- Only the requester can create a booking
drop policy if exists local_bookings_insert_requester on public.local_bookings;
create policy local_bookings_insert_requester
  on public.local_bookings
  for insert
  with check (requester_id = auth.uid());

-- Helper can update status (accept / decline); requester cannot change status
drop policy if exists local_bookings_update_helper on public.local_bookings;
create policy local_bookings_update_helper
  on public.local_bookings
  for update
  using (helper_id = auth.uid())
  with check (helper_id = auth.uid());
