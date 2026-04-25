TravelAI - Kapsamlı Ürün Gereksinim Dokümanı (PRD) v2.0Proje İsmi: TravelAIVersiyon: 2.0 (Genişletilmiş MVP)Teknoloji Yığını: Swift (iOS), FastAPI (Backend), Supabase (DB/Auth), Render (Host)1. ÜRÜN VİZYONU VE STRATEJİK HEDEFLERTravelAI, üniversite öğrencilerinin seyahat planlama, bütçe yönetimi ve kültürel keşif süreçlerini yapay zeka desteğiyle tek bir platformda çözen bir eko-sistemdir.Problem: Öğrenciler için seyahat planlamak dağınık, pahalı ve zaman alıcıdır.Çözüm: AI ile 1 dakikada bütçe odaklı rota, "Askıda Bilet" ile kültürel erişim ve uçtan uca lojistik rehberlik.2. KULLANICI PERSONASI VE DENEYİM AKIŞIPersona: Gezgin Alp (21, Üniversite Öğrencisi). Kısıtlı bütçesi var, yeni kültürler tanımak istiyor, karmaşık arayüzlerden hoşlanmıyor.Kullanıcı Yolculuğu (Happy Path)Uygulama Açılışı & .edu Mail Doğrulaması.AI Planner Ekranı: Şehir, bütçe (Slider), ilgi alanları (Chips) seçimi.Rota Oluşturma: 5-10 saniyelik "AI Hazırlıyor" animasyonu.İnteraktif Zaman Çizelgesi: Saatlik plan, harita entegrasyonu ve bütçe dökümü.Askıda Bilet Keşfi: Şehirdeki ücretsiz müze/etkinlik kodlarını alma.3. FONKSİYONEL GEREKSİNİMLER (EPICS & USER STORIES)EPIC 1: Güvenli Öğrenci Giriş Sistemi (Auth & Verification)US.1.1: Bir kullanıcı olarak, .edu uzantılı mailimle kayıt olup OTP koduyla doğrulanmak istiyorum.Kabul Kriterleri (AC):Sistem sadece .edu ve .edu.tr uzantılı domainleri kabul etmeli.Supabase Auth modülü üzerinden e-posta doğrulaması yapılmalı.Başarılı girişte profiles tablosunda kullanıcı oluşturulmalı.EPIC 2: AI Smart Itinerary Engine (Zeki Planlayıcı)US.2.1: Bir kullanıcı olarak, bütçeme uygun, saatlik ve harita destekli bir rota almak istiyorum.Kabul Kriterleri (AC):Parametreler: destination, start_date, end_date, budget_tier (Economy, Mid, Comfort), interests (list).FastAPI, LLM (GPT-4o/Flash) kullanarak kesinlikle JSON formatında yanıt dönmeli.Yanıt içeriği: Aktivite adı, lokasyon koordinatları, tahmini maliyet, ulaşım önerisi.EPIC 3: Askıda Bilet & Kültürel ErişimUS.3.1: Bir kullanıcı olarak, seyahat ettiğim şehirdeki ücretsiz bilet havuzunu görüp claim etmek istiyorum.Kabul Kriterleri (AC):Biletler kategoriye göre (Müze, Konser, Sergi) filtrelenebilmeli.Bir bilet claim edildiğinde is_claimed anlık güncellenmeli (Concurrency Lock).Kullanıcıya çevrimdışı da görülebilen bir QR/Referans kodu verilmeli.4. VERİTABANI TASARIMI (SUPABASE / POSTGRESQL)-- Kullanıcı Profilleri
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    full_name TEXT,
    edu_email TEXT UNIQUE NOT NULL,
    university_name TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seyahat Planları
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    city_name TEXT NOT NULL,
    budget_limit DECIMAL,
    itinerary_data JSONB, -- AI çıktısının tamamı burada saklanır
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Askıda Biletler
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    location_name TEXT,
    category TEXT CHECK (category IN ('Museum', 'Concert', 'Art', 'Networking')),
    claim_code TEXT UNIQUE,
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMP WITH TIME ZONE
);
5. TEKNİK MİMARİ VE API UÇ NOKTALARI (FASTAPI)Mimari Notlar:FastAPI: Python tabanlı asenkron backend. Render üzerinde uvicorn ile çalışacak.AI Integration: OpenAI API veya Google Gemini API (FastAPI tarafında yönetilecek).Swift Integration: URLSession veya Alamofire ile REST API iletişimi.API Endpoints:POST /auth/verify-edu: E-posta uzantı kontrolü.POST /itinerary/generate: Kullanıcı tercihlerini alıp AI rotası döner.GET /tickets/available?city={city}: Şehirdeki boş biletleri listeler.POST /tickets/claim/{ticket_id}: Bileti kullanıcı adına rezerve eder.6. KULLANICI ARAYÜZÜ (UI) VE EKRANLAR (SWIFTUI)Onboarding & Auth View: Modern, minimalist giriş ekranı. Apple ID entegrasyonu + Edu Mail input.Planner Hub: Seçim tekerlekleri ve slider'lar ile interaktif seyahat parametreleri girişi.Itinerary Timeline:Dikey zaman çizgisi.Her durak için Apple Maps yönlendirme butonu.Hava durumu (WeatherKit entegrasyonu önerilir).Ticket Marketplace: Kart tabanlı, görsel ağırlıklı bilet listesi.Profile & Wallet: Kaydedilen rotalar ve alınan biletlerin QR kodları.7. KRİTİK BAŞARI VE KABUL KRİTERLERİ (QA)AI rotası her zaman tutarlı JSON dönmeli (Pydantic validation kullanılacak).Uygulama, internet koptuğunda en son yüklenen rotayı cache'den göstermeli (CoreData/UserDefaults)..edu dışı giriş denemeleri kesinlikle bloklanmalı.8. FAZLANDIRMA PLANIFaz 1 (Genişletilmiş MVP): Yukarıdaki tüm özellikler.Faz 2: Travel Buddy eşleşmesi, Acil Durum SOS, Lokal Chatbot.Faz 3: In-app ödeme, B2B Sponsor Paneli, Oyunlaştırma.