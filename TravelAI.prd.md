TravelAI - Ürün Gereksinim Dokümanı (PRD) 

Ürün İsmi: TravelAI

Platform: Mobile-First Responsive Web Application

Teknoloji Stack: Next.js, FastAPI, Supabase, OpenRouter (LLM)

Hedef Kitle: Küresel Üniversite Öğrencileri

1. ÜRÜN VİZYONU VE TEMEL AMAÇ

TravelAI, öğrencilerin seyahatlerini bütçe dostu, kültürel ve sosyal bağlar odaklı (lokal öğrenci rehberliği) hale getiren yapay zeka tabanlı bir platformdur. Amacı, öğrencileri "turist" kimliğinden çıkarıp "global birer gezgin" haline getirmek ve seyahati demokratikleştirmektir.

2. KULLANICI YÖNETİMİ VE AUTH (STUDENT VERIFICATION)

2.1 .edu Mail Filtresi & Kayıt

Gereksinim: Kayıt ekranında sadece .edu veya .edu.tr (veya küresel muadilleri) uzantılı e-postalar kabul edilir.

Doğrulama: Kullanıcı mailine 6 haneli (6-digit) bir OTP doğrulama kodu gönderilir.

Profil: Başarılı doğrulamadan sonra kullanıcı adı, üniversite bilgisi ve şifre belirlenerek users tablosu oluşturulur.

2.2 Veritabanı: Users Tablosu

id (UUID, PK)

email (Unique)

full_name (Text)

university_name (Text)

is_verified (Boolean)

created_at (Timestamp)

3. CORE AI CHAT & THINKING MODU

3.1 Chat-First Parametre Toplama

Uygulama açılışında kullanıcıyı minimalist bir chat ekranı karşılar. AI, "Thinking" fazına geçmeden önce şu 7 parametreyi sohbet akışında kesinleştirmelidir:

Nereden - Nereye? (Lokasyon/Rota)

Kaç Günlük? (Seyahat Süresi)

Konaklama Tercihi? (Hostel, paylaşımlı ev, vb.)

Ülkenin Vize Durumu? (Pasaport tipine göre sorgu)

Bütçe Aralığı? (Öğrenci dostu limitler)

Ulaşım Tercihi? (Tren, ucuz hava yolları, otobüs)

İlgi Alanları? (Kültürel, tarihi, sosyal odak)

3.2 Thinking Modu (The Engine)

Tüm parametreler toplandığında ekranda görsel bir "Thinking Mode" animasyonu başlar. Bu sırada backend (FastAPI):

OpenRouter üzerinden LLM'i tetikler.

Lokal öğrenci aktiviteleri veritabanı ile eşleşme yapar.

Bütçe optimizasyonu için veri setlerini tarar.

4. DETAYLI SEYAHAT PLANI (OUTPUT)

Yapay zeka çıktısı, "Must-Have" olarak nitelendirdiğimiz şu kalemleri günlere ayrılmış şekilde sunar:

Günlük Planlar: Sabah, öğle, akşam bazlı akış.

Ulaşım: En bütçe dostu şehir içi ulaşım (lokal kartlar vb.)

Tahmini Bütçe: Kalem kalem harcama planı (Yemek, ulaşım, giriş ücretleri).

Best Locations & Historical Spots: Şehrin ruhunu yansıtan ve öğrencilere hitap eden noktalar.

Lokal Öğrenci Aktiviteleri: Uygulamanın imzası. (Örn: "Münih Teknik Üniversitesi öğrencisi Kate ile Kinder Garden yürüyüşü").

Konaklama: Bölge ve fiyat bazlı en iyi öğrenci opsiyonları.


5. VERİTABANI TASARIMI (RELATIONAL MODEL)

Tüm tablolarda created_at bilgisi zorunludur.

5.1 Trips (Geziler)

id (PK)

user_id (FK)

destination (Text)

origin (Text)

duration_days (Int)

total_budget_est (Decimal)

visa_info (Text)

created_at (Timestamp)

5.2 Trip_Days (Günlük Detaylar)

id (PK)

trip_id (FK)

day_number (Int)

date (Date)

created_at (Timestamp)

5.3 Trip_Items (Aktiviteler)

id (PK)

day_id (FK)

type (Enum: Transport, Food, Historical, Local_Activity, Accommodation)

title (Text)

description (Text)

cost_est (Decimal)

local_host_name (Text - Optional)

local_host_uni (Text - Optional)

created_at (Timestamp)

6. TEKNİK ENTEGRASYONLAR

Frontend (Next.js): PWA (Progressive Web App) özellikli, mobile-first responsive.

API (OpenRouter): Model bağımsız AI çağrıları.

Backend (FastAPI): Python tabanlı asenkron logic, Supabase SDK entegrasyonu.

Database (Supabase): PostgreSQL tabanlı, RLS (Row Level Security) ile kullanıcı bazlı veri güvenliği.

7. KABUL KRİTERLERİ (ACCEPTANCE CRITERIA)

Kullanıcı mailine gelen 6 haneli OTP doğrulanmadan sisteme giremez.

Chat kısmında 7 temel soru cevaplanmadan AI "Thinking Mode" tetiklenmez.

Geçmiş geziler, kullanıcı profilinde seyahat detaylarına (ilişkisel tablolar üzerinden) erişecek şekilde listelenir.
