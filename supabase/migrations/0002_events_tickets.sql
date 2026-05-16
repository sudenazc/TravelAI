-- TravelAI - Phase 2 schema: events & tickets

-- Events: curated experiences available for purchase
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('museum', 'networking', 'workshop', 'local')),
  image_url text not null,
  date text not null,
  time text not null,
  location text not null,
  price_usd numeric not null,
  spots_left integer,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- Tickets: purchased event tickets tied to a user
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  status text not null default 'upcoming' check (status in ('upcoming', 'used', 'expired')),
  purchased_at timestamp with time zone not null default now()
);

create index if not exists tickets_user_id_idx on public.tickets (user_id, purchased_at desc);

-- RLS
alter table public.events enable row level security;
alter table public.tickets enable row level security;

-- events: anyone can read active events
drop policy if exists events_select_all on public.events;
create policy events_select_all
  on public.events
  for select
  using (is_active = true);

-- tickets: users can only read and insert their own tickets
drop policy if exists tickets_select_own on public.tickets;
create policy tickets_select_own
  on public.tickets
  for select
  using (auth.uid() = user_id);

drop policy if exists tickets_insert_own on public.tickets;
create policy tickets_insert_own
  on public.tickets
  for insert
  with check (auth.uid() = user_id);

-- Seed events
insert into public.events (title, category, image_url, date, time, location, price_usd, spots_left) values
  (
    'The Louvre — Skip-the-Line Guided Tour',
    'museum',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
    'May 15, 2026',
    '10:00 AM – 1:00 PM',
    'Paris, France',
    49,
    3
  ),
  (
    'Tech Founders Mixer — Barcelona Summit',
    'networking',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
    'May 20, 2026',
    '6:00 PM – 10:00 PM',
    'Barcelona, Spain',
    29,
    18
  ),
  (
    'Traditional Japanese Ceramics Workshop',
    'workshop',
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80',
    'May 22, 2026',
    '2:00 PM – 5:00 PM',
    'Kyoto, Japan',
    65,
    8
  ),
  (
    'Sunset Walk & Stories with a Local Guide',
    'local',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
    'May 18, 2026',
    '5:30 PM – 8:00 PM',
    'Lisbon, Portugal',
    22,
    6
  ),
  (
    'Rijksmuseum — Dutch Masters Private Evening',
    'museum',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80',
    'May 25, 2026',
    '7:00 PM – 9:30 PM',
    'Amsterdam, Netherlands',
    75,
    12
  ),
  (
    'Sustainable Travel Networking Brunch',
    'networking',
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80',
    'May 28, 2026',
    '11:00 AM – 2:00 PM',
    'Copenhagen, Denmark',
    35,
    22
  ),
  (
    'Neapolitan Pizza-Making Masterclass',
    'workshop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    'Jun 1, 2026',
    '12:00 PM – 3:30 PM',
    'Naples, Italy',
    55,
    10
  ),
  (
    'Hidden Istanbul: Bazaars & Tea with Locals',
    'local',
    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
    'Jun 5, 2026',
    '9:00 AM – 1:00 PM',
    'Istanbul, Turkey',
    30,
    5
  )
on conflict do nothing;
