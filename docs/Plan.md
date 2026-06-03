# TravelAI — Geliştirme Planı

> PRD'den türetilen, kullanıcı hikayelerine bölünmüş teknik adımlar.  
> Her EPIC için: User Stories → Backend Tasks → Frontend Tasks → DB/Schema Tasks → Kabul Kriterleri.

**Durum göstergeleri:** `[x]` tamamlandı · `[ ]` bekliyor · `[~]` devam ediyor

---

## EPIC 1 — Auth & Student Verification

**Durum:** `[x]` Tamamlandı (`commit: 1680921`)

### User Stories
- **US.1.1:** Bir kullanıcı olarak, `.edu` uzantılı mailimle kayıt olup OTP koduyla doğrulanmak istiyorum.

### Backend Tasks
- [x] `POST /auth/verify-edu` — domain validation guard
- [x] Supabase JWT doğrulama dependency (`dependencies.py`)
- [x] `core/security.py` — JWKS + PyJWT imza doğrulaması
- [x] `schemas/auth.py` — Pydantic request/response modelleri

### Frontend Tasks
- [x] `/login` sayfası — `.edu` email input, Supabase OTP gönder
- [x] `/register` sayfası — kayıt formu, domain validasyonu
- [x] `AuthContext` — session yönetimi, `onAuthStateChange`
- [x] `middleware.ts` — korumalı route'lar için redirect guard
- [x] `lib/auth.ts` — Supabase client auth helper'ları
- [x] Auth form bileşenleri (`components/auth/login-form`, `register-form`)

### DB/Schema Tasks
- [x] `profiles` tablosu + RLS (migration `0001`)
- [x] Supabase Auth email OTP aktif

### Kabul Kriterleri
- [x] `.edu` dışı domain → bloklanır, net hata mesajı
- [x] Doğru domain → OTP akışı çalışır
- [x] Başarılı doğrulama sonrası `profiles` kaydı oluşturulur
- [x] Auth olmadan korumalı sayfalara erişim redirect ile engellenir

---

## EPIC 2 — AI Trip Planner + Cost Optimized Trip

**Durum:** `[x]` Temel planner tamamlandı (`commits: 1cffbd3, 27a54fb`) · `[ ]` Cost Optimization + Enriched Prompt bekliyor

### User Stories
- **US.2.1:** Bir kullanıcı olarak, bütçeme uygun, saatlik ve kültürel odaklı bir rota almak istiyorum.
- **US.2.2:** Rota Company Opportunities ve Local Helper bilgilerini içersin, AI bunları otomatik dahil etsin.

### Backend Tasks
- [x] `POST /itinerary/generate` — temel LLM çağrısı, Pydantic validation
- [x] OpenRouter entegrasyonu (model-agnostic)
- [x] `schemas/itinerary.py` — request/response Pydantic modelleri
- [ ] `GET opportunities?city=&dates=` sorgusunu itinerary generate içine entegre et
- [x] `GET profiles?is_local_helper=true&region=` sorgusunu trip generate'e entegre et (`_inject_local_helpers`)
- [ ] Enriched LLM prompt: user params + deals (opportunities henüz eklenmedi)
- [ ] LLM "repair" stratejisi (Pydantic validation başarısız olursa ikinci çağrı)
- [ ] Thinking Mode için senkron timeout yönetimi (10–20s)

### Frontend Tasks
- [x] `/planner` — chat-first parametre toplama ekranı
- [x] Suggestion chips bileşeni
- [x] Typing indicator + AI mesaj balonu bileşenleri
- [x] Thinking Mode animasyonu (skeleton + loading state)
- [x] Itinerary render: günlük kartlar, bütçe özeti
- [x] `/planner/[id]` — kaydedilmiş itinerary detay sayfası
- [ ] Local Helper opt-in sorusu (7. parametre olarak chat'e ekle)
- [ ] Itinerary'de Company Opportunities highlight kartları
- [x] Itinerary'de Local Helper slot kartı (booking CTA) — `LocalHelperCard` + `HelperModal`

### DB/Schema Tasks
- [x] `trips` tablosu — `itinerary_data JSONB` (migration `0001`)
- [ ] `trips` tablosuna `is_cloned`, `cloned_from` alanları ekle (migration `0003`)

### Kabul Kriterleri
- [x] 7 parametre tamamlanmadan Thinking Mode tetiklenmez
- [x] LLM her zaman geçerli JSON döndürür
- [ ] Itinerary'de Company Opportunities ve Local Helper slotları görünür
- [ ] Enriched prompt üretimi test edilir (unit test)

---

## EPIC 3 — Trips Persistence & Profile History

**Durum:** `[x]` Tamamlandı (`commit: 31d269b`)

### User Stories
- **US.3.1:** Bir kullanıcı olarak, oluşturduğum seyahatleri kaydedip profilimde geçmiş gezilerimi görmek istiyorum.

### Backend Tasks
- [x] `POST /trips` — itinerary + meta kaydet
- [x] `GET /trips` — kullanıcı trip listesi
- [x] `GET /trips/{id}` — trip detayı
- [x] `PATCH /trips/{id}` — rename / active flag
- [x] JWT auth dependency tüm trip endpoint'lerine uygulandı

### Frontend Tasks
- [x] `/my-trips` — trip listesi (MyTripCard bileşeni)
- [x] `/profile` — profil sayfası, geçmiş geziler bağlantısı
- [x] `components/cards/my-trip-card.tsx`

### DB/Schema Tasks
- [x] `trips` tablosu RLS — `auth.uid() = user_id`

### Kabul Kriterleri
- [x] Trip'ler kullanıcı bazlı listelenir
- [x] Başka kullanıcının trip'ine erişim RLS ile engellenir
- [x] Trip otomatik kaydedilir (generate sonrası)

---

## EPIC 4 — Company Opportunities (Genişletilmiş Askıda Bilet)

**Durum:** `[~]` Core opportunities tamamlandı · `[ ]` Push notification + AI enrichment Faz 2'ye bırakıldı

### User Stories
- **US.4.1:** Bir kullanıcı olarak, seyahat ettiğim şehirdeki ücretsiz/indirimli fırsatları görüp claim etmek istiyorum.
- **US.4.2:** Last-minute fırsatlar için push notification almak istiyorum.
- **US.4.3:** AI planner fırsatları otomatik olarak itinerary'me eklesin.

### Backend Tasks
- [x] `GET /tickets` — mevcut ticket listeleme
- [x] `POST /tickets/purchase` — bilet satın alma (temel)
- [x] `opportunities` tablosu seed data ile doldur (migration `0003`, 8 örnek fırsat)
- [x] `GET /opportunities?city={city}&category={category}` — filtreleme (`ilike` city, exact category)
- [x] `POST /opportunities/claim/{id}` — concurrency lock ile atomik claim (`claimed_by IS NULL` koşulu)
- [x] `GET /opportunities/wallet` — kullanıcının claim'leri + `claim_code`
- [ ] Push notification altyapısı (last-minute deals için, Faz 2)
- [ ] AI planner enrichment: opportunities → itinerary slot injection

### Frontend Tasks
- [x] `/tickets` — Ticket Market + Opportunities segment switcher
- [x] `components/tickets/buy-ticket-modal.tsx`
- [x] `components/tickets/wallet-section.tsx` — claimed opportunities alt bölümü eklendi
- [x] `components/tickets/opportunity-card.tsx` — kategori badge, fiyat karşılaştırması, "Claim" butonu
- [x] Last-minute badge + countdown timer bileşeni (`opportunity-card.tsx` içinde)
- [x] `components/tickets/claim-modal.tsx` — claim akışı + `claim_code` gösterimi
- [x] Profile Wallet'ta claimed opportunities listesi (wallet-section güncellendi)

### DB/Schema Tasks
- [x] `tickets` tablosu (migration `0002`)
- [x] `opportunities` tablosu + RLS (migration `0003`)
- [x] `is_last_minute`, `event_date`, `offer_price` alanları

### Kabul Kriterleri
- [x] Fırsatlar kategoriye ve şehre göre filtrelenebilir
- [x] Claim edilince `status` anlık güncellenir (ikinci claim başarısız olur — 409)
- [x] Claim sonrası `claim_code` referansı Wallet'ta görünür
- [ ] AI itinerary'de uygun fırsatlar highlight edilmiş gösterilir (Faz 2)

---

## EPIC 5 — Share Experience & Learn From Others

**Durum:** `[ ]` Henüz başlanmadı

### User Stories
- **US.5.1:** Bir kullanıcı olarak, gezi deneyimimi blog yazısıyla paylaşmak istiyorum.
- **US.5.2:** Başkalarının gezilerini keşfedip kendi profilime kaydetmek istiyorum.

### Backend Tasks
- [ ] `POST /experiences` — blog yayımla (trip_id + user_id bağlı)
- [ ] `GET /experiences?city={city}&tags={tags}` — feed listele, filtrele
- [ ] `GET /experiences/{id}` — yazı detayı
- [ ] `POST /experiences/:id/like` — beğen (idempotent)
- [ ] `POST /experiences/:id/save` — itinerary klon → saved trips
- [ ] `schemas/experiences.py` — Pydantic modelleri

### Frontend Tasks
- [ ] Share Experience tab / sayfası — feed listesi
- [ ] Şehir / ilgi alanı filtre chips
- [ ] Blog yazısı okuma ekranı — medya, like/save butonları
- [ ] "Share Experience" buton → yazı oluşturma formu (profile/my-trips'ten)
- [ ] Blog yazma editor (markdown veya rich text)
- [ ] Like animasyonu + save feedback
- [ ] Profile'da "Saved Trips" bölümü (cloned itinerary'ler)

### DB/Schema Tasks
- [ ] `experiences` tablosu + RLS (migration `0003`)
- [ ] `experience_likes` tablosu (unique constraint)
- [ ] `trips.is_cloned`, `trips.cloned_from` alanları

### Kabul Kriterleri
- [ ] Blog yazısı `trip_id`'ye bağlı oluşturulabilir
- [ ] Feed şehir/ilgi alanına göre filtrelenir
- [ ] Like idempotent — iki kez tıklayınca geri alınır
- [ ] Save → klonlanan trip, kullanıcının "Saved Trips"inde görünür
- [ ] Başkasının yazısını düzenleyemez (RLS)

---

## EPIC 6 — Local Help (Yerel Rehberlik)

**Durum:** `[x]` Tamamlandı (Jun 3, 2026) · `[ ]` Bildirim + ödeme Faz 2'ye bırakıldı

### User Stories
- **US.6.1:** Bir kullanıcı olarak, kendi şehrimde lokal rehber olarak kaydolup gelen öğrencilerle eşleşmek istiyorum.
- **US.6.2:** Gittiğim şehirde yerel bir öğrenciden rehberlik almak istiyorum.

### Backend Tasks
- [x] `PUT /locals/profile` — toggle + detayları güncelle (region, bio, availability)
- [x] `GET /locals?region={region}` — bölgedeki aktif helper'ları listele
- [x] `POST /locals/book/:helper_id` — booking talebi, UUID validasyonu + helper aktiflik kontrolü
- [x] `GET /locals/bookings` — booking geçmişi (requester + helper rolleri ayrı)
- [x] AI planner enrichment: `_inject_local_helpers()` — hedef şehirdeki helperlar Day 1'e `local_activity` olarak eklenir
- [x] `schemas/locals.py` — `LocalHelperUpdate`, `LocalHelperProfile`, `BookingRequest`, `BookingResponse`, `BookingsListResponse`

### Frontend Tasks
- [x] Profile sayfasına "Be a Local Helper" toggle bileşeni
- [x] Helper detay formu — region input, bio textarea, availability input
- [x] `components/locals/local-helper-card.tsx` — avatar, bio, meta + "Connect" CTA
- [x] `components/locals/helper-modal.tsx` — detay modal + booking formu + success state
- [x] Booking onay ekranı — modal success state (her iki tarafa bildirim Faz 2)
- [x] Profile'da "My Bookings" bölümü — pending/accepted/declined badge'leri ile liste

### DB/Schema Tasks
- [x] `profiles` tablosuna alanlar eklendi: `is_local_helper`, `helper_region`, `helper_bio`, `helper_availability` (migration `0004`)
- [x] `local_bookings` tablosu oluşturuldu — temel booking akışı (ödeme kolonları Faz 2'ye bırakıldı)

### Kabul Kriterleri
- [x] Toggle açıldıktan sonra helper o bölge için AI planner'da görünür
- [x] AI itinerary'e uygun helper'ı otomatik olarak slot olarak ekler
- [ ] Booking → her iki tarafa bildirim gönderilir (Faz 2 — push notification altyapısı)
- [x] Booking profil sayfasında "My Bookings" listesinde gösterilir

---

## DB Migration Planı

| Migration | İçerik | Durum |
|---|---|---|
| `0001_profiles_trips_rls.sql` | `profiles` + `trips` + RLS | [x] Tamamlandı |
| `0002_events_tickets.sql` | `tickets` tablosu | [x] Tamamlandı |
| `0003_opportunities.sql` | `opportunities` tablosu + RLS + seed data (8 fırsat) | [x] Tamamlandı |
| `0004_local_helpers.sql` | `profiles` yeni alanları (`is_local_helper`, `helper_region`, `helper_bio`, `helper_availability`) + `local_bookings` tablosu + RLS | [x] Tamamlandı |
| `0005_experiences.sql` | `experiences`, `experience_likes` + `trips` yeni alanları (`is_cloned`, `cloned_from`) | [ ] Bekliyor |

---

## API Sözleşmesi Özeti

```
Auth
  POST /auth/verify-edu

Itinerary
  POST /itinerary/generate

Trips
  POST   /trips
  GET    /trips
  GET    /trips/{id}
  PATCH  /trips/{id}

Opportunities
  GET    /opportunities
  POST   /opportunities/claim/:id
  GET    /opportunities/wallet

Tickets (mevcut)
  GET    /tickets
  POST   /tickets/claim/{id}

Experiences
  POST   /experiences
  GET    /experiences
  GET    /experiences/{id}
  POST   /experiences/:id/like
  POST   /experiences/:id/save

Locals
  PUT    /locals/profile
  GET    /locals
  POST   /locals/book/:helper_id
  GET    /locals/bookings

Profile
  GET    /users/me
  PUT    /users/me
  DELETE /users/me

Health
  GET    /api/health
```

---

## Out of Scope (Faz 3+)

- Travel Buddy eşleşmesi
- Acil Durum SOS
- Lokal Chatbot
- In-app ödeme (Stripe)
- B2B Sponsor Panel
- Oyunlaştırma (puanlar, rozetler)
- iOS native app
- Client code generator (OpenAPI → TS/Swift)
