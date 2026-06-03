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
- [ ] `GET profiles?is_local_helper=true&region=` sorgusunu prompt context'e ekle
- [ ] Enriched LLM prompt: user params + deals + local helpers
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
- [ ] Itinerary'de Local Helper slot kartı (booking CTA)

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

**Durum:** `[ ]` Henüz başlanmadı

### User Stories
- **US.6.1:** Bir kullanıcı olarak, kendi şehrimde lokal rehber olarak kaydolup gelen öğrencilerle eşleşmek istiyorum.
- **US.6.2:** Gittiğim şehirde yerel bir öğrenciden rehberlik almak istiyorum.

### Backend Tasks
- [ ] `PUT /profile/local-helper` — toggle + detayları güncelle (region, bio, availability)
- [ ] `GET /locals?region={region}` — bölgedeki aktif helper'ları listele
- [ ] `POST /locals/book/:helper_id` — booking talebi, availability kontrolü
- [ ] `GET /locals/bookings` — booking geçmişi
- [ ] AI planner enrichment: local helpers → itinerary slot injection
- [ ] `schemas/locals.py` — Pydantic modelleri

### Frontend Tasks
- [ ] Profile sayfasına "Be a Local Helper" toggle bileşeni
- [ ] Helper detay formu — region, bio, availability picker
- [ ] Itinerary'de Local Helper kart bileşeni (bio + "Connect" CTA)
- [ ] Helper profil modal — detay görünümü + booking akışı
- [ ] Booking onay ekranı — her iki tarafa bildirim senaryosu
- [ ] Profile'da "My Bookings" bölümü

### DB/Schema Tasks
- [ ] `profiles` tablosuna alanlar ekle: `is_local_helper`, `helper_region`, `helper_bio`, `helper_availability` (migration `0003`)
- [ ] Helper booking tablosu (Faz 2 — ödeme entegrasyonu ile birlikte)

### Kabul Kriterleri
- [ ] Toggle açıldıktan sonra helper o bölge için AI planner'da görünür
- [ ] AI itinerary'e uygun helper'ı otomatik olarak slot olarak ekler
- [ ] Booking → her iki tarafa bildirim gönderilir
- [ ] Booking trip timeline'ında gösterilir

---

## DB Migration Planı

| Migration | İçerik | Durum |
|---|---|---|
| `0001_profiles_trips_rls.sql` | `profiles` + `trips` + RLS | [x] Tamamlandı |
| `0002_events_tickets.sql` | `tickets` tablosu | [x] Tamamlandı |
| `0003_opportunities.sql` | `opportunities` tablosu + RLS + seed data (8 fırsat) | [x] Tamamlandı |
| `0004_new_features.sql` | `experiences`, `experience_likes` + `profiles` yeni alanları (`is_local_helper` vb.) + `trips` yeni alanları | [ ] Bekliyor |

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
  GET    /locals
  POST   /locals/book/:helper_id
  GET    /locals/bookings

Profile
  GET    /profile/me
  PUT    /profile/local-helper

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
