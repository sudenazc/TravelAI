-- TravelAI - Phase 3 schema: company opportunities (askıda bilet)

create table if not exists public.opportunities (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  city           text not null,
  category       text not null check (category in ('Museum', 'Concert', 'Art', 'Hotel', 'Workshop', 'Festival', 'Networking')),
  provider_name  text,
  original_price numeric,
  offer_price    numeric,
  is_free        boolean not null default false,
  status         text not null default 'available' check (status in ('available', 'claimed', 'expired')),
  claim_code     text unique,
  claimed_by     uuid references public.profiles (id) on delete set null,
  is_last_minute boolean not null default false,
  expires_at     timestamp with time zone,
  event_date     timestamp with time zone,
  created_at     timestamp with time zone not null default now()
);

create index if not exists opportunities_city_idx      on public.opportunities (city);
create index if not exists opportunities_category_idx  on public.opportunities (category);
create index if not exists opportunities_status_idx    on public.opportunities (status);
create index if not exists opportunities_claimed_by_idx on public.opportunities (claimed_by);

-- RLS
alter table public.opportunities enable row level security;

-- Anyone can browse available opportunities
drop policy if exists opportunities_select_available on public.opportunities;
create policy opportunities_select_available
  on public.opportunities
  for select
  using (status = 'available' or claimed_by = auth.uid());

-- Only authenticated users can claim (update) an unclaimed opportunity
drop policy if exists opportunities_claim_own on public.opportunities;
create policy opportunities_claim_own
  on public.opportunities
  for update
  using (claimed_by is null)
  with check (claimed_by = auth.uid());

-- Seed opportunities
insert into public.opportunities
  (title, description, city, category, provider_name, original_price, offer_price, is_free, is_last_minute, claim_code, expires_at, event_date)
values
  (
    'Free Entry — Musée d''Orsay',
    'Complimentary entry for students to the Impressionist masterpieces collection.',
    'Paris',
    'Museum',
    'Musée d''Orsay',
    17,
    0,
    true,
    false,
    'OPP-ORSAY-001',
    now() + interval '30 days',
    now() + interval '7 days'
  ),
  (
    '50% Off — Picasso Museum Barcelona',
    'Half-price student discount for the permanent collection and current exhibition.',
    'Barcelona',
    'Art',
    'Museu Picasso',
    14,
    7,
    false,
    false,
    'OPP-PICASSO-002',
    now() + interval '45 days',
    now() + interval '14 days'
  ),
  (
    'Free Night — Generator Hostel Amsterdam',
    'One complimentary night stay for verified student travellers.',
    'Amsterdam',
    'Hotel',
    'Generator Amsterdam',
    89,
    0,
    true,
    false,
    'OPP-GENAMS-003',
    now() + interval '20 days',
    now() + interval '10 days'
  ),
  (
    'Last-Minute: Jazz Night at Blue Note Tokyo',
    'Unsold seats released 3 hours before showtime — free entry for students.',
    'Tokyo',
    'Concert',
    'Blue Note Tokyo',
    55,
    0,
    true,
    true,
    'OPP-JAZZ-004',
    now() + interval '1 day',
    now() + interval '1 day'
  ),
  (
    'Student Workshop — Photography in Istanbul',
    'Street photography workshop led by local photographer. Limited to 12 students.',
    'Istanbul',
    'Workshop',
    'Istanbul Photo Hub',
    40,
    10,
    false,
    false,
    'OPP-PHOTO-005',
    now() + interval '15 days',
    now() + interval '8 days'
  ),
  (
    'Last-Minute: Flamenco Show Seville',
    'Two complimentary tickets for tonight''s flamenco performance — last 3 seats.',
    'Seville',
    'Festival',
    'Casa de la Guitarra',
    35,
    0,
    true,
    true,
    'OPP-FLAM-006',
    now() + interval '12 hours',
    now() + interval '12 hours'
  ),
  (
    'Free Entry — Tate Modern London',
    'Free permanent collection access plus 30% off special exhibitions for students.',
    'London',
    'Museum',
    'Tate Modern',
    0,
    0,
    true,
    false,
    'OPP-TATE-007',
    now() + interval '60 days',
    now() + interval '30 days'
  ),
  (
    'Startup Founders Networking — Berlin Tech Week',
    'Complimentary student pass for the evening networking session.',
    'Berlin',
    'Networking',
    'Berlin Tech Week',
    45,
    0,
    true,
    false,
    'OPP-BTW-008',
    now() + interval '25 days',
    now() + interval '18 days'
  )
on conflict do nothing;
