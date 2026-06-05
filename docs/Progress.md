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

### EPIC 2 — AI Trip Planner Cost Optimization + Enrichment
- **Tarih:** Jun 4, 2026
- **İçerik:**
  - `backend/schemas/trips.py` — `GenerateTripRequest`'e `want_local_helper: bool = True` alanı eklendi
  - `backend/routers/trips.py` — `_fetch_opportunities()`: generate çağrısından önce destination'a ait max 5 fırsatı DB'den çeker
  - `backend/routers/trips.py` — `_build_user_prompt()` genişletildi: opportunities varsa prompt'a `Available deals in {city}:` bloğu eklenir; LLM bunları itinerary aktivitelerine dahil etmesi için yönlendirilir
  - `backend/routers/trips.py` — `_repair_call()`: parse hatası alındığında aynı model ile ikinci çağrı yapılır; hatalı JSON + hata mesajı gönderilir, düzeltilmiş JSON beklenir
  - `backend/routers/trips.py` — `httpx.AsyncClient` global `timeout=90s` kaldırıldı; her model çağrısı `MODEL_TIMEOUT = Timeout(connect=5s, read=20s)` ile yapılır; `TimeoutException` yakalanınca sonraki modele geçilir
  - `backend/routers/trips.py` — `generate_trip()`: `req.want_local_helper` `False` ise `_inject_local_helpers` atlanır
  - `frontend/src/app/planner/page.tsx` — `GenerateTripParams`'a `want_local_helper: boolean` eklendi; `PARAM_STEPS`'e 8. adım (local guide opt-in sorusu, "Yes, connect me!" / "No thanks" chip'leri); `parseWantLocalHelper()` fonksiyonu; karşılama mesajı ve boş panel metni "7 → 8 soru" güncellendi
  - `frontend/src/app/planner/[id]/page.tsx` — `OpportunityHighlightCard` ve `DealsSection` bileşenleri eklendi; trip yüklenince `GET /opportunities?city=` çağrılır (max 3); `ClaimModal` entegre edildi; claim sonrası o opportunity listeden kaldırılır
  - `supabase/migrations/0005_trips_clone.sql` — `trips` tablosuna `is_cloned boolean DEFAULT false` ve `cloned_from uuid REFERENCES trips(id) ON DELETE SET NULL` kolonları eklendi
- **Karar:** Opportunities DB'den çekilip LLM prompt'una eklendi; doğrudan itinerary'ye injection yerine LLM'in bunları özgünce planlaması tercih edildi
- **Karar:** Repair call aynı modelde `temperature=0.2` ile yapılır; başarısız olursa mevcut fallback zinciri devam eder — ekstra maliyet minimum tutuldu
- **Karar:** `want_local_helper` default `True` olarak ayarlandı; mevcut oluşturulmuş trip'ler etkilenmez

---

### EPIC 5 — Share Experience & Learn From Others
- **Tarih:** Jun 4, 2026
- **İçerik:**
  - `supabase/migrations/0006_experiences.sql` — `experiences` tablosu (title, body, city, tags[], cover_image_url, likes_count) + `experience_likes` composite-PK tablosu; her ikisinde RLS (feed/detay herkese açık, insert/update/delete yalnızca kendi kaydı)
  - `backend/schemas/experiences.py` — `CreateExperienceRequest`, `ExperienceResponse`, `LikeResponse` Pydantic modelleri
  - `backend/dependencies.py` — `get_optional_user` dependency eklendi (token olmadığında `None` döndürür, 401 fırlatmaz)
  - `backend/routers/experiences.py` — 5 endpoint: `GET /experiences` (feed + city/tags filtre + opsiyonel auth), `POST /experiences` (oluştur), `GET /experiences/{id}` (detay + is_liked), `POST /experiences/{id}/like` (toggle idempotent), `POST /experiences/{id}/save` (trip klonla)
  - `backend/app.py` — `experiences` router kaydedildi
  - `frontend/src/components/cards/experience-card.tsx` — cover image, city badge, tag chip'leri, likes sayacı, tarih; `index.ts`'e eklendi
  - `frontend/src/app/experiences/page.tsx` — public feed; şehir arama + popular city chip'leri + tag chip'leri; `ExperienceCard` grid; boş/hata/yükleme durumları; "Share Experience" CTA
  - `frontend/src/app/experiences/[id]/page.tsx` — blog detay; paragraf render (`\n\n` split); optimistic like toggle + kalp animasyonu; "Save Itinerary" butonu (klonlama) + toast feedback; 401 → `/login` yönlendirme
  - `frontend/src/app/experiences/new/page.tsx` — yazı oluşturma formu; title, city, linked trip dropdown (`?trip_id=` prefill), cover_image_url, tag yönetimi (suggested + custom), write/preview toggle textarea editor; submit → `/experiences/{id}` yönlendirme
  - `frontend/src/app/profile/page.tsx` — "Saved Trips" bölümü eklendi; `GET /trips` sonucunda `is_cloned === true` olanlar listelenir
  - `frontend/src/app/planner/[id]/page.tsx` — "Share Experience" butonu hero aksiyonlarına eklendi (`/experiences/new?trip_id={id}`)
  - `frontend/src/app/my-trips/page.tsx` — klonlanmamış her trip kartı altına "Share Experience" linki eklendi
  - `frontend/src/components/navigation/bottom-tab-bar.tsx` — "Stories" sekmesi eklendi (`BookOpenText` ikonu, `/experiences`)
  - `frontend/src/components/navigation/top-nav.tsx` — desktop nav'a "Experiences" linki eklendi
  - `frontend/src/middleware.ts` — `/experiences/new` korumalı rotalar listesine eklendi
- **Karar:** Markdown editör için TipTap/MDX gibi ek kütüphane eklenmedi; textarea + `white-space: pre-wrap` + paragraph split yeterli bulundu (sıfır ekstra bağımlılık)
- **Karar:** Feed ve detay sayfaları public (auth yok); yalnızca like/save/create korumalı — `get_optional_user` dependency ile sağlandı
- **Karar:** `experience_likes` composite PK ile idempotent toggle: satır varsa DELETE, yoksa INSERT; her işlemde `likes_count` güncellenir
- **Hata & Düzeltme:** Bkz. Hatalar tablosu — `maybeSingle()` ve `maybe_single().execute() → None` hataları

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
- **Hata & Düzeltme:** `POST /locals/book/{helper_id}` endpoint'ine AI üretimi gerçek adres metni (`Mühlenstr. 3-100`) gönderilince Postgres UUID parse hatası oluştu. İki katmanlı düzeltme: (1) `parseHelperFromActivity` — `helper_id:` prefiksi olmayan `local_activity` slotlarını artık helper olarak işlemiyor; (2) `routers/locals.py` — `book_local_helper` endpoint'ine DB sorgusundan önce UUID format validasyonu eklendi

---

## Devam Eden İşler

_(Şu an aktif devam eden iş yok)_

---

## MVP Scope Dışı Bırakılan İşler

Tüm EPIC'lerde `[ ]` kalan maddeler ve uzak vade özellikleri `docs/Plan.md → MVP Scope Dışı` bölümüne taşınmıştır.

**Faz 2 (ertelenen):**

| Özellik | Neden Ertelendi |
|---|---|
| Push notification altyapısı | Service worker + izin yönetimi ayrı infra; MVP için gereksiz karmaşıklık |
| AI → opportunities slot injection | Mevcut prompt-enrichment akışı MVP için yeterli; post-processing Faz 2 |
| AI itinerary'de opportunities highlight | Slot injection'a bağımlı; önceki madde tamamlanmadan anlamsız |
| Booking bildirimleri (Local Help) | Push altyapısına bağımlı |
| Enriched prompt unit test | Test altyapısı kurulmadı; işlevsel akış çalışıyor |

**Faz 3+ (uzak vade):** Travel Buddy, SOS, Lokal Chatbot, Stripe, B2B Panel, Oyunlaştırma, iOS app, OpenAPI codegen — bkz. `Plan.md`.

---

## Hatalar & Notlar

| Tarih | Bileşen | Açıklama | Çözüm |
|---|---|---|---|
| Jun 3, 2026 | `routers/locals.py` + `planner/[id]/page.tsx` | AI üretimi `local_activity` slotundaki gerçek adres metni (`Mühlenstr. 3-100`) `helper_id` olarak DB'ye gönderildi → Postgres UUID parse hatası (500) | Frontend'de `parseHelperFromActivity` yalnızca `helper_id:` prefiksi olan slotları helper olarak işliyor; backend'de UUID format guard clause eklendi (400 döndürür) |
| Jun 4, 2026 | `routers/experiences.py` | `maybeSingle()` camelCase metod adı kullanıldı → `AttributeError` (500) | supabase-py async client snake_case kullanır; tüm çağrılar `maybe_single()` olarak düzeltildi |
| Jun 4, 2026 | `routers/experiences.py` | `maybe_single().execute()` satır bulunamadığında `None` döndürüyor (`.data = None` olan bir nesne değil); `.data` erişimi `AttributeError` verdi | `_data(result)` yardımcı fonksiyonu eklendi: `result is None` ise `None` döndürür; tüm `maybe_single` sonuçları bu fonksiyondan geçirildi |
