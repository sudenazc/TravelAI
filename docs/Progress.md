# TravelAI — Progress

> Her işlemin, alınan kararların ve hataların kaydı. Git geçmişine göre oluşturulmuştur.  
> Yeni bir şey tamamlandığında bu dosyayı güncelle.

**Durum:** `[x]` tamamlandı · `[~]` devam ediyor · `[ ]` bekliyor

---

## Tamamlanan İşler (Git Geçmişi)

### `31fc9e5` — Initial commit
- **Tarih:** Projenin başlangıcı
- **İçerik:** Repo oluşturuldu

---

### `b200e24` — Add PRD docs and ignore macOS artifacts
- **İçerik:** `TravelAI.prd.md` ve `Projectoverview_prd.md` eklendi; `.gitignore` macOS artifact'ları içerecek şekilde güncellendi
- **Karar:** Projenin iki ayrı PRD versiyonu (v1 web + v2 iOS) ile başlamasına karar verildi

---

### `6d3f7b8` — Add backend uv setup and Supabase schema/RLS
- **İçerik:**
  - FastAPI backend iskeleti kuruldu (`main.py`, `app.py`, `core/`, `db/`, `routers/`, `schemas/`)
  - `pyproject.toml` + `uv.lock` ile bağımlılık yönetimi
  - Supabase migration `0001_profiles_trips_rls.sql`: `profiles` + `trips` tabloları + RLS
  - Supabase migration `0002_events_tickets.sql`: `tickets` tablosu
- **Karar:** Paket yönetimi olarak `uv` seçildi (pip'e göre daha hızlı, lock-file tabanlı)
- **Karar:** Veri modeli olarak `trips.itinerary_data JSONB` (MVP için hızlı) tercih edildi

---

### `b03f8d0` — Initialize frontend
- **İçerik:**
  - Next.js 14 (App Router) projesi kuruldu
  - Tailwind CSS + PostCSS yapılandırması
  - `tailwind.config.ts` — sky palette + custom tokens
  - `styles/tokens.css` + `styles/globals.css`
  - `.env.example` oluşturuldu
- **Karar:** Framework olarak Next.js App Router seçildi (RSC + nested layouts)

---

### `df6a928` — Introduce planner page
- **İçerik:**
  - `/planner` route oluşturuldu
  - Temel planner sayfa yapısı

---

### `16af3c4` — Introduce ticket page
- **İçerik:**
  - `/tickets` route oluşturuldu
  - Temel ticket sayfası

---

### `66506ad` — Introduce my tickets page
- **İçerik:**
  - My Tickets sayfası eklendi
  - Wallet section bileşeni

---

### `b996ffe` + `2f207fb` — Update TravelAI.prd.md (x2)
- **İçerik:** PRD dokümanı iki kez revize edildi
- **Karar:** Özellik kapsamı ve kabul kriterleri netleştirildi

---

### `1680921` — Implement auth
- **İçerik:**
  - `backend/routers/auth.py` — `POST /auth/verify-edu`
  - `backend/core/security.py` — Supabase JWT + JWKS doğrulaması
  - `backend/dependencies.py` — `get_current_user` FastAPI dependency
  - `frontend/src/app/(auth)/login/page.tsx`
  - `frontend/src/app/(auth)/register/page.tsx`
  - `frontend/src/contexts/auth-context.tsx`
  - `frontend/src/app/middleware.ts` — korumalı route redirect
  - `frontend/src/lib/auth.ts`
  - `components/auth/login-form`, `register-form`
- **Karar:** Supabase Auth email OTP kullanıldı; backend yalnızca token doğrular, login yapmaz

---

### `1cffbd3` — Introduce planner (chat flow)
- **İçerik:**
  - AI chat arayüzü — mesaj balonları, suggestion chips
  - `components/chat/bubble.tsx`, `chat/input.tsx`, `chat/chips.tsx`, `chat/typing-indicator.tsx`
  - Chat-first parametre toplama akışı

---

### `27a54fb` — Implement trip planner logic
- **İçerik:**
  - `backend/routers/trips.py` — `/trips` CRUD endpoint'leri
  - `backend/schemas/trips.py` — Pydantic modelleri
  - OpenRouter LLM entegrasyonu (`/itinerary/generate`)
  - Itinerary JSON render (günlük kartlar, bütçe özeti)
  - `frontend/src/app/planner/[id]/page.tsx`
- **Karar:** OpenRouter tercih edildi (model-agnostic, maliyet esnekliği)

---

### `31d269b` — Introduce tickets and profile page
- **İçerik:**
  - `backend/routers/tickets.py` — ticket CRUD + claim
  - `backend/schemas/tickets.py`
  - `frontend/src/app/profile/page.tsx`
  - `frontend/src/app/my-trips/page.tsx`
  - `components/tickets/buy-ticket-modal.tsx`
  - `components/tickets/wallet-section.tsx`
  - Navigation bileşenleri: `bottom-tab-bar`, `top-nav`, `nav-auth-section`
  - UI atom bileşenler: `badge`, `button`, `input`, `search-input`
  - Destination + Event + Trip kart bileşenleri

---

### EPIC 4 — Company Opportunities (Core)
- **Tarih:** Jun 3, 2026
- **İçerik:**
  - `supabase/migrations/0003_opportunities.sql` — `opportunities` tablosu, RLS, 8 seed fırsat (2 tanesi `is_last_minute = TRUE`)
  - `backend/schemas/opportunities.py` — `OpportunityResponse`, `ClaimedOpportunityResponse` Pydantic modelleri
  - `backend/routers/opportunities.py` — `GET /opportunities` (city `ilike` + category filtresi), `POST /opportunities/claim/{id}` (atomik concurrency lock), `GET /opportunities/wallet`
  - `backend/app.py` — `opportunities` router kaydedildi
  - `frontend/src/types/tickets.ts` — `OpportunityCategory`, `OpportunityStatus`, `OpportunityResponse`, `ClaimedOpportunityResponse` tipleri eklendi
  - `frontend/src/components/tickets/opportunity-card.tsx` — kategori badge, şehir/sağlayıcı bilgisi, fiyat karşılaştırması (üstü çizgili orijinal → ücretsiz/indirimli), last-minute canlı countdown timer
  - `frontend/src/components/tickets/claim-modal.tsx` — `confirm → loading → success` akışı; success state'de `claim_code` monospace gösterimi
  - `frontend/src/app/tickets/page.tsx` — "Ticket Market" / "Opportunities" segment switcher; şehir input filtresi + kategori chip'leri; tüm claim state yönetimi
  - `frontend/src/components/tickets/wallet-section.tsx` — "My Claimed Opportunities" alt bölümü eklendi; her satırda `claim_code` etiketi
- **Karar:** Concurrency lock için Supabase service-role UPDATE + `claimed_by IS NULL` koşulu kullanıldı; ayrı transaction/lock mekanizması gerekmedi
- **Karar:** QR kod için harici kütüphane yerine monospace `claim_code` metin kutusu tercih edildi (sıfır bağımlılık)
- **Kapsam dışı bırakılan (Faz 2):** Push notification altyapısı, AI planner → opportunities enrichment

---

### Dokümantasyon Konsolidasyonu
- **İçerik:**
  - Tüm dokümantasyon `docs/` altında 5 zorunlu dosyada birleştirildi:
    - `docs/PRD.md` — v3.0 (6 EPIC, yeni özellikler dahil)
    - `docs/tech-stack.md`
    - `docs/Plan.md`
    - `docs/DesignSystem.md`
    - `docs/Progress.md`
  - Eski kaynak dosyalar silindi: `TravelAI.prd.md`, `Projectoverview_prd.md`, `docs/auth_and_jwt.md`, `frontend/travel-ai-design-system.md`
  - `.cursor/rules/TravelAI-design-system.mdc` → `docs/DesignSystem.md` path'ine güncellendi
- **Karar:** Tek kaynak (single source of truth) prensibine geçildi; çift dosya kaldırıldı

---

### EPIC 6 — Local Help (Yerel Rehberlik)
- **Tarih:** Jun 3, 2026
- **İçerik:**
  - `supabase/migrations/0004_local_helpers.sql` — `profiles` tablosuna 4 kolon (`is_local_helper`, `helper_region`, `helper_bio`, `helper_availability`); `local_bookings` tablosu (requester/helper FK, status check, no-self-booking constraint) + RLS politikaları
  - `backend/schemas/locals.py` — `LocalHelperUpdate`, `LocalHelperProfile`, `LocalHelperListResponse`, `BookingRequest`, `BookingResponse`, `BookingsListResponse`
  - `backend/schemas/user.py` — `UserProfile`'a 4 yeni opsiyonel helper field eklendi
  - `backend/routers/locals.py` — 4 endpoint: `PUT /locals/profile`, `GET /locals?region=`, `POST /locals/book/{helper_id}`, `GET /locals/bookings`
  - `backend/routers/trips.py` — `_inject_local_helpers()`: trip oluşturulurken hedef şehirdeki aktif helperlar Day 1'e `local_activity` slotu olarak eklenir (konum `helper_id:<uuid>` formatında saklanır)
  - `backend/app.py` — `locals` router kaydedildi; Swagger'da `BearerAuth` güvenliği eklendi
  - `frontend/src/components/locals/local-helper-card.tsx` — initials avatar, bio, region/availability meta, "Connect" CTA
  - `frontend/src/components/locals/helper-modal.tsx` — helper detay modal; mesaj textarea + `POST /locals/book/:id` entegrasyonu; idle/loading/success 3-state akışı
  - `frontend/src/components/locals/index.ts` — barrel export
  - `frontend/src/app/profile/page.tsx` — "Be a Local Helper" toggle + koşullu detay formu; `PUT /locals/profile` kaydetme; "My Bookings" bölümü (pending/accepted/declined badge)
  - `frontend/src/app/planner/[id]/page.tsx` — `parseHelperFromActivity()` ile `local_activity` slotları `LocalHelperCard` olarak render edilir; "Connect" → `HelperModal`
- **Karar:** `local_bookings` tablosu ödeme kolonları olmadan oluşturuldu; Stripe entegrasyonu Faz 2'ye bırakıldı
- **Karar:** Helper kimliği `ActivityItem.location` alanına `helper_id:<uuid>` prefiksiyle gömüldü; bu sayede AI prompt'u değiştirmeden parse edilebiliyor
- **Kapsam dışı bırakılan (Faz 2):** Push notification (booking kabul/ret bildirimleri), ödeme entegrasyonu
- **Hata & Düzeltme:** `POST /locals/book/{helper_id}` endpoint'ine AI üretimi gerçek adres metni (`Mühlenstr. 3-100`) gönderilince Postgres UUID parse hatası oluştu. İki katmanlı düzeltme: (1) `parseHelperFromActivity` — `helper_id:` prefiksi olmayan `local_activity` slotlarını artık helper olarak işlemiyor; (2) `routers/locals.py` — `book_local_helper` endpoint'ine DB sorgusundan önce UUID format validasyonu eklendi

---

## Devam Eden İşler

### `[~]` EPIC 2 — Cost Optimized Trip Enrichment
- Temel AI planner çalışıyor; Company Opportunities enrichment bekliyor
- Local Helper enrichment (`_inject_local_helpers`) **tamamlandı** (EPIC 6 kapsamında)
- Yapılacak:
  - [ ] Opportunities sorgusunu itinerary generate'e entegre et
  - [ ] Enriched LLM prompt testi

---

## Bekleyen İşler

### `[ ]` DB Migration 0005 — Experiences Tabloları
- `experiences` + `experience_likes` tabloları
- `trips` tablosuna: `is_cloned`, `cloned_from`

---

### `[ ]` EPIC 5 — Share Experience & Learn From Others
- [ ] `POST /experiences` — blog yayımla
- [ ] `GET /experiences?city=&tags=` — feed
- [ ] `POST /experiences/:id/like` — beğen (idempotent)
- [ ] `POST /experiences/:id/save` — itinerary klon
- [ ] Frontend: Share Experience tab, feed listesi, şehir/ilgi filtresi
- [ ] Frontend: Blog yazısı okuma ekranı (like + save CTA)
- [ ] Frontend: Blog yazma formu (profile/my-trips'ten tetiklenir)
- [ ] Frontend: Profile'da "Saved Trips" bölümü

---

## Hatalar & Notlar

> Bu bölüme geliştirme sırasında karşılaşılan hatalar, alınan kararlar ve önemli notlar eklenecek.

| Tarih | Bileşen | Açıklama | Çözüm |
|---|---|---|---|
| Jun 3, 2026 | `routers/locals.py` + `planner/[id]/page.tsx` | AI üretimi `local_activity` slotundaki gerçek adres metni (`Mühlenstr. 3-100`) `helper_id` olarak DB'ye gönderildi → Postgres UUID parse hatası (500) | Frontend'de `parseHelperFromActivity` yalnızca `helper_id:` prefiksi olan slotları helper olarak işliyor; backend'de UUID format guard clause eklendi (400 döndürür) |
