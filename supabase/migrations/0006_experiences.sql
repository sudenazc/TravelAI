-- Epic 5 — Share Experience & Learn From Others
-- Creates the experiences and experience_likes tables with RLS.

-- Experiences: user-authored travel blog posts linked to a trip
create table if not exists public.experiences (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  trip_id        uuid references public.trips (id) on delete set null,
  title          text not null check (char_length(title) >= 3 and char_length(title) <= 200),
  body           text not null check (char_length(body) >= 10),
  city           text,
  tags           text[] not null default '{}',
  cover_image_url text,
  likes_count    integer not null default 0 check (likes_count >= 0),
  created_at     timestamp with time zone not null default now()
);

create index if not exists experiences_user_id_idx    on public.experiences (user_id);
create index if not exists experiences_city_idx       on public.experiences (city);
create index if not exists experiences_created_at_idx on public.experiences (created_at desc);

-- Experience likes: one row per (experience, user) pair — composite PK enforces uniqueness
create table if not exists public.experience_likes (
  experience_id uuid not null references public.experiences (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamp with time zone not null default now(),
  primary key (experience_id, user_id)
);

-- RLS
alter table public.experiences     enable row level security;
alter table public.experience_likes enable row level security;

-- experiences policies
drop policy if exists experiences_select_all    on public.experiences;
create policy experiences_select_all
  on public.experiences for select using (true);

drop policy if exists experiences_insert_own    on public.experiences;
create policy experiences_insert_own
  on public.experiences for insert
  with check (auth.uid() = user_id);

drop policy if exists experiences_update_own    on public.experiences;
create policy experiences_update_own
  on public.experiences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists experiences_delete_own    on public.experiences;
create policy experiences_delete_own
  on public.experiences for delete
  using (auth.uid() = user_id);

-- experience_likes policies
drop policy if exists likes_select_all on public.experience_likes;
create policy likes_select_all
  on public.experience_likes for select using (true);

drop policy if exists likes_insert_own on public.experience_likes;
create policy likes_insert_own
  on public.experience_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists likes_delete_own on public.experience_likes;
create policy likes_delete_own
  on public.experience_likes for delete
  using (auth.uid() = user_id);
