# TravelAI — Ürün Gereksinim Dokümanı (PRD) v3.0

> **Versiyon:** 3.0  
> **Platform:** Mobile-First Responsive Web Application (Next.js PWA)  
> **Teknoloji Stack:** Next.js, FastAPI, Supabase, OpenRouter (LLM)  
> **Hedef Kitle:** Küresel Üniversite Öğrencileri

---

## 1. Ürün Vizyonu & Stratejik Hedefler

TravelAI, üniversite öğrencilerinin seyahat planlama, bütçe yönetimi ve kültürel keşif süreçlerini yapay zeka desteğiyle tek bir platformda çözen bir ekosistemdir.

**Problem:** Öğrenciler için seyahat planlamak dağınık, pahalı ve zaman alıcıdır.

**Çözüm:** AI ile dakikalar içinde bütçe odaklı rota, "Company Opportunities" ile kültürel erişim, "Share Experience" ile akran öğrenimi ve "Local Help" ile yerel rehberlik — uçtan uca seyahat deneyimi.

**Misyon:** Öğrencileri "turist" kimliğinden çıkarıp "global birer gezgin" haline getirmek ve seyahati demokratikleştirmek.

---

## 2. Hedef Kullanıcı (Persona)

**Gezgin Alp — 21, Üniversite Öğrencisi**
- Kısıtlı bütçesiyle yeni kültürler tanımak istiyor
- Karmaşık arayüzlerden hoşlanmıyor, hızlı karar almayı seviyor
- Mobil öncelikli kullanıcı; her şeyin tek uygulamada olmasını bekliyor
- Fiziksel seyahat edemediğinde de kültürü tüketmek istiyor

**Kullanıcı Yolculuğu (Happy Path)**
1. `.edu` mail ile kayıt → OTP doğrulaması
2. AI Planner: şehir, bütçe, ilgi alanları seçimi (chat akışı)
3. "AI Hazırlıyor" animasyonu (Thinking Mode)
4. Günlük + saatlik interaktif itinerary çıktısı
5. Company Opportunities ile indirimli biletler/konaklamalar
6. Gezisini Share Experience'ta paylaşma veya başkasının gezi planını kendi profiline kaydetme
7. Local Helper ile özgün kültür deneyimi

---

## 3. Fonksiyonel Gereksinimler (EPICs & User Stories)

---

### EPIC 1 — Güvenli Öğrenci Giriş Sistemi (Auth & Verification)

**US.1.1 — Edu Kayıt & Doğrulama**
> "Bir kullanıcı olarak, .edu uzantılı mailimle kayıt olup OTP koduyla doğrulanmak istiyorum."

**Kabul Kriterleri:**
- Sistem sadece `.edu` ve `.edu.tr` uzantılı (ve küresel muadili) domainleri kabul eder
- Supabase Auth email OTP akışı ile doğrulama yapılır
- Başarılı doğrulama sonrası `profiles` tablosunda kayıt oluşturulur
- Profil tamamlama: kullanıcı adı, üniversite adı, şifre
- `.edu` dışı giriş denemeleri kesinlikle bloklanır

**Domain Kontrolü:**
- `POST /auth/verify-edu` endpoint'i: domain güvenlik guard
- Frontend'de izin verilen suffix listesi (`*.edu`, `*.edu.tr` + küresel muadiller)

---

### EPIC 2 — AI Smart Itinerary Engine (Cost Optimized Trip)

**US.2.1 — Chat ile Parametre Toplama → Thinking → Itinerary**
> "Bir kullanıcı olarak, bütçeme uygun, saatlik ve kültürel odaklı bir rota almak istiyorum."

**Kabul Kriterleri:**
- Chat akışında 7 parametre tamamlanmadan "Thinking Mode" tetiklenmez
- AI, Company Opportunities ve Local Help verilerini sorguladıktan sonra zenginleştirilmiş LLM prompt'u oluşturur
- Backend LLM çağrısından kesin JSON döner; Pydantic v2 ile doğrulanır
- Itinerary: günlük bölümlenmiş akış, tahmini bütçe kalemleri, ulaşım önerisi, POI önerileri, Local Helper slotları ve Company Opportunities yer alır

**7 Chat Parametresi:**
1. Nereden → Nereye? (Lokasyon/Rota)
2. Kaç Günlük? (Seyahat Süresi)
3. Konaklama Tercihi? (Hostel, paylaşımlı ev, vb.)
4. Ülkenin Vize Durumu? (Pasaport tipine göre sorgu)
5. Bütçe Aralığı? (`economy` / `mid` / `comfort`)
6. Ulaşım Tercihi? (Tren, ucuz hava yolları, otobüs)
7. İlgi Alanları? (Kültürel, tarihi, sosyal) + Local Helper tercihi

**Cost Optimizasyon Mantığı:**
- Rota sadece turistik değil; ücretsiz müzeler, yürüyüş odaklı güzergahlar, dil/kültür gelişimine katkılı noktalar öne çıkarılır
- Company Opportunities tablosundan destinasyon + tarih eşleşmeli fırsatlar AI prompt'una enjekte edilir
- Eğer `is_local_help: true` seçildiyse, o bölgedeki aktif Local Helper'lar LLM context'ine dahil edilir

**Backend Akışı:**
```
POST /itinerary/generate
  ↓ Query opportunities table (destination + dates)
  ↓ Query local_helpers (region + availability)
  ↓ Build enriched LLM prompt
  ↓ OpenRouter LLM call
  ↓ Pydantic validation
  ↓ Return structured itinerary JSON
```

**Itinerary Çıktısı (Must-Have):**
- Günlük Planlar: sabah / öğle / akşam bazlı akış
- Ulaşım: en bütçe dostu şehir içi ulaşım
- Tahmini Bütçe: kalem kalem harcama planı
- Best Locations & Historical Spots
- Local Öğrenci Aktiviteleri ve Helper slotları
- Konaklama: bölge ve fiyat bazlı öğrenci opsiyonları
- Company Opportunities: uygun fırsatlar highlight edilmiş

---

### EPIC 3 — Trips Persistence & Profile History

**US.3.1 — Trip Kaydetme & Geçmiş Geziler**
> "Bir kullanıcı olarak, oluşturduğum seyahatleri kaydedip profilimde geçmiş gezilerimi görmek istiyorum."

**Kabul Kriterleri:**
- Trip'ler kullanıcı bazlı saklanır, RLS ile korunur
- Kullanıcı geçmiş trip listesini ve seçili trip detayını görebilir
- Trip, itinerary üretimi sonrasında otomatik olarak Supabase'e kaydedilir
- Başka kullanıcının trip'ine erişim engellenir

**API Endpoint'leri:**
```
POST   /trips          → kaydet
GET    /trips          → liste
GET    /trips/{id}     → detay
PATCH  /trips/{id}     → güncelle (isim, aktiflik)
```

---

### EPIC 4 — Company Opportunities (Kurumsal Askıda Bilet & Fırsat Pazarı)

**US.4.1 — Fırsat Keşfetme & Claim**
> "Bir kullanıcı olarak, seyahat ettiğim şehirdeki ücretsiz/indirimli bilet ve fırsatları görüp claim etmek istiyorum."

**Kabul Kriterleri:**
- Fırsatlar kategoriye göre (Müze, Konser, Sergi, Otel, Workshop, Festival) filtrelenebilir
- Bilet claim edildiğinde `status` anlık güncellenir (Concurrency Lock)
- Kullanıcıya QR / referans kodu verilir (Profile Wallet'ta görünür)
- Yeni Last-Minute fırsatlar, aktif seyahati olan kullanıcılara push notification ile gönderilir
- AI Planner, itinerary üretirken uygun fırsatları otomatik olarak gün slotlarına enjekte eder

**Özellikler:**
- **Genişletilmiş Askıda Sistem:** Müze biletleri + otel, workshop, tiyatro, festival için kurumsal sponsorlu havuz
- **Last-Minute Fırsatları:** Son dakika iptal olan/boş kalan rezervasyonlar büyük indirimle listelenir; hem şirketin zararı önlenir hem öğrenci ucuza konaklama/etkinlik bulur
- **MVP'de veri kaynağı:** Mock/seed data; B2B Sponsor Panel Faz 2'de

**API Endpoint'leri:**
```
GET  /opportunities?city={city}&category={category}  → listele
POST /opportunities/claim/:id                         → claim et
GET  /opportunities/wallet                            → kullanıcı claim'leri
```

---

### EPIC 5 — Share Experience & Learn From Others (Gitmesen De Keşfet)

**US.5.1 — Kültür Günlüğü Yayımlama & Keşfetme**
> "Bir kullanıcı olarak, gezi deneyimimi blog yazısıyla paylaşmak ve başkalarının gezilerini keşfedip kendi profilime kaydetmek istiyorum."

**Kabul Kriterleri:**
- Kullanıcı tamamlanan bir geziye bağlı blog yazısı oluşturabilir
- Yazıda: müze anıları, kültürel notlar, fotoğraf/medya eklenebilir
- Diğer öğrenciler feed'i şehir/ilgi alanına göre filtreler
- Okuyucu beğeni (like) verebilir ve itinerary'yi kendi profiline kaydedebilir (clone)
- Kaydedilen geziler Profile'da "Saved Trips" olarak görünür

**Akış:**
- **Yazar:** Gezisini tamamla → "Share Experience" tıkla → blog yaz → gönder → feed'e düşer
- **Okuyucu:** Feed'i aç → filtrele → yazıyı oku → like veya "Save Trip" (itinerary clone edilir)

**API Endpoint'leri:**
```
POST /experiences              → blog yayımla
GET  /experiences?city={city}  → feed listele
POST /experiences/:id/like     → beğen
POST /experiences/:id/save     → itinerary klonla (Saved Trips'e ekle)
```

---

### EPIC 6 — Local Help (Yerel Rehberlik & Mikrogirişimcilik)

**US.6.1 — Local Helper Olma & Eşleşme**
> "Bir kullanıcı olarak, kendi şehrimde lokal rehber olarak kaydolup gelen öğrencilerle eşleşmek istiyorum."

**US.6.2 — Gezide Local Helper ile Buluşma**
> "Bir kullanıcı olarak, gittiğim şehirde yerel bir öğrenciden rehberlik almak istiyorum."

**Kabul Kriterleri:**
- Her öğrenci profil sayfasından "Be a Local Helper" toggle'ını açabilir
- Helper detayları: bölge/şehir, uygun tarih & saatler, kısa bio, ne tür deneyim sunduğu
- Kayıt anında AI Planner tarafından aranabilir hale gelir (o bölge için)
- AI Planner itinerary üretirken uygun helper'ları gün bloklarına yerleştirir
- Gezgin, helper kartını tıklayıp "Connect" ile booking yapar
- Booking: her iki tarafa bildirim gönderilir; trip timeline'ına eklenir

**Şu An (MVP):** Düşük bütçeli mikro-tur fiyatlandırması (5–10 €) — temel booking akışı
**Faz 2:** Ödeme entegrasyonu, değerlendirme sistemi

**API Endpoint'leri:**
```
PUT  /profile/local-helper          → helper toggle + detayları kaydet
GET  /locals?region={region}        → bölgedeki helper'ları listele
POST /locals/book/:helper_id        → booking talebi
GET  /locals/bookings               → booking geçmişi
```

---

## 4. Veritabanı Tasarımı (Supabase / PostgreSQL)

Tüm tablolarda `created_at` zorunludur. RLS ile kullanıcı bazlı güvenlik uygulanır.

### `profiles` (Kullanıcı Profilleri)
```sql
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users,
    full_name       TEXT,
    edu_email       TEXT UNIQUE NOT NULL,
    university_name TEXT,
    is_local_helper BOOLEAN DEFAULT FALSE,
    helper_region   TEXT,
    helper_bio      TEXT,
    helper_availability JSONB,    -- { dates: [], hours: [] }
    points          INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `trips` (Seyahat Planları)
```sql
CREATE TABLE trips (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES profiles(id),
    city_name       TEXT NOT NULL,
    origin          TEXT,
    duration_days   INTEGER,
    budget_tier     TEXT CHECK (budget_tier IN ('economy', 'mid', 'comfort')),
    budget_limit    DECIMAL,
    itinerary_data  JSONB,        -- AI çıktısının tamamı
    is_active       BOOLEAN DEFAULT TRUE,
    is_cloned       BOOLEAN DEFAULT FALSE,
    cloned_from     UUID REFERENCES trips(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `opportunities` (Company Opportunities / Askıda Bilet)
```sql
CREATE TABLE opportunities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    description     TEXT,
    city            TEXT NOT NULL,
    category        TEXT CHECK (category IN ('Museum', 'Concert', 'Art', 'Hotel', 'Workshop', 'Festival', 'Networking')),
    provider_name   TEXT,
    original_price  DECIMAL,
    offer_price     DECIMAL,
    is_free         BOOLEAN DEFAULT FALSE,
    status          TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'expired')),
    claim_code      TEXT UNIQUE,
    claimed_by      UUID REFERENCES profiles(id),
    is_last_minute  BOOLEAN DEFAULT FALSE,
    expires_at      TIMESTAMP WITH TIME ZONE,
    event_date      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `experiences` (Share Experience — Blog Yazıları)
```sql
CREATE TABLE experiences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES profiles(id),
    trip_id         UUID REFERENCES trips(id),
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,      -- Blog yazısı (markdown)
    city            TEXT,
    media_urls      JSONB,              -- fotoğraf/video URL listesi
    like_count      INTEGER DEFAULT 0,
    save_count      INTEGER DEFAULT 0,
    tags            TEXT[],
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `experience_likes` (Beğeniler)
```sql
CREATE TABLE experience_likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id   UUID REFERENCES experiences(id),
    user_id         UUID REFERENCES profiles(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (experience_id, user_id)
);
```

### `tickets` (Mevcut — Supabase Migration 0002)
```sql
-- Mevcut yapı korunur; opportunities tablosu bu tabloyu genişletir
CREATE TABLE tickets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name  TEXT NOT NULL,
    location_name TEXT,
    category    TEXT CHECK (category IN ('Museum', 'Concert', 'Art', 'Networking')),
    claim_code  TEXT UNIQUE,
    is_claimed  BOOLEAN DEFAULT FALSE,
    claimed_by  UUID REFERENCES profiles(id),
    expires_at  TIMESTAMP WITH TIME ZONE
);
```

### RLS Kuralları
```sql
-- profiles: yalnızca kendi kaydını görebilir/güncelleyebilir
-- trips: yalnızca kendi trip'lerini görebilir/yönetebilir
-- opportunities: herkes görebilir, yalnızca claimed_by = auth.uid() olan kendi claim'ini görür
-- experiences: herkes okuyabilir, yalnızca kendi yazısını düzenleyebilir
-- experience_likes: herkes okuyabilir, yalnızca kendi beğenisini ekleyebilir/silebilir
```

---

## 5. Teknik Entegrasyonlar

| Katman | Teknoloji | Açıklama |
|---|---|---|
| Frontend | Next.js 14 (App Router) | PWA özellikli, mobile-first responsive |
| API | FastAPI + Python 3.12 | Async backend, Pydantic v2 validation |
| AI | OpenRouter | Model bağımsız LLM çağrıları (GPT-4o / Gemini Flash) |
| Database | Supabase (PostgreSQL) | RLS ile kullanıcı bazlı güvenlik |
| Auth | Supabase Auth | Email OTP, JWT token doğrulama |
| Deploy | Vercel (FE) + Render (BE) | Bağımsız pipeline'lar |

---

## 6. Kabul Kriterleri (QA)

- `.edu` dışı giriş denemeleri kesinlikle bloklanır
- Chat'te 7 parametre tamamlanmadan AI Thinking Mode tetiklenmez
- AI rotası her zaman tutarlı JSON döner (Pydantic validation)
- Bir fırsat claim edildiğinde `status` anlık güncellenir (Concurrency Lock)
- Geçmiş geziler kullanıcı profilinde listelenir; başka kullanıcının gezisine erişilemez
- Share Experience feed'i şehir / ilgi alanına göre filtreler
- Local Helper booking her iki tarafa bildirim gönderir

---

## 7. Fazlandırma Planı

| Faz | Kapsam |
|---|---|
| **Faz 1 — MVP** | Auth + AI Trip Planner (Cost Optimized) + Trip Persistence + Company Opportunities (mock data) |
| **Faz 2** | Share Experience + Local Help + Push Notifications + B2B Sponsor Panel |
| **Faz 3** | In-app ödeme, Local Helper değerlendirme sistemi, Oyunlaştırma (puanlar), Travel Buddy eşleşmesi |
| **Faz 4** | Acil Durum SOS, Lokal Chatbot, iOS native app |
