# Supabase (schema + RLS)

## Apply migrations

- Supabase SQL Editor’da sırayla çalıştır:
  - `supabase/migrations/0001_profiles_trips_rls.sql`

## Tables (Phase 1)

- `public.profiles`: `auth.users` ile 1:1
- `public.trips`: MVP için itinerary’yi `itinerary_data JSONB` olarak saklar

## RLS model

- `profiles`: sadece kendi satırına erişim
- `trips`: sadece kendi `user_id` satırlarına erişim

