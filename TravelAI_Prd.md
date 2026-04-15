# **TravelAI \- Kapsamlı Ürün Gereksinim Dokümanı (PRD) v2.0**

**Proje İsmi:** TravelAI  
**Versiyon:** 2.0 (Genişletilmiş MVP)  
**Teknoloji Yığını:** Swift (iOS), FastAPI (Backend), Supabase (DB/Auth), Render (Host)

## **1\. ÜRÜN VİZYONU VE STRATEJİK HEDEFLER**

TravelAI, üniversite öğrencilerinin seyahat planlama, bütçe yönetimi ve kültürel keşif süreçlerini yapay zeka desteğiyle tek bir platformda çözen bir eko-sistemdir.

* **Problem:** Öğrenciler için seyahat planlamak dağınık, pahalı ve zaman alıcıdır.  
* **Çözüm:** AI ile 1 dakikada bütçe odaklı rota, "Askıda Bilet" ile kültürel erişim ve uçtan uca lojistik rehberlik.

## **2\. KULLANICI PERSONASI VE DENEYİM AKIŞI**

**Persona:** Gezgin Alp (21, Üniversite Öğrencisi). Kısıtlı bütçesi var, yeni kültürler tanımak istiyor, karmaşık arayüzlerden hoşlanmıyor.

### **Kullanıcı Yolculuğu (Happy Path)**

1. Uygulama Açılışı & .edu Mail Doğrulaması.  
2. AI Planner Ekranı: Şehir, bütçe (Slider), ilgi alanları (Chips) seçimi.  
3. Rota Oluşturma: 5-10 saniyelik "AI Hazırlıyor" animasyonu.  
4. İnteraktif Zaman Çizelgesi: Saatlik plan, harita entegrasyonu ve bütçe dökümü.  
5. Askıda Bilet Keşfi: Şehirdeki ücretsiz müze/etkinlik kodlarını alma.

## **3\. FONKSİYONEL GEREKSİNİMLER (EPICS & USER STORIES)**

### **EPIC 1: Güvenli Öğrenci Giriş Sistemi (Auth & Verification)**

* **US.1.1:** Bir kullanıcı olarak, .edu uzantılı mailimle kayıt olup OTP koduyla doğrulanmak istiyorum.  
* **Kabul Kriterleri (AC):**  
  * Sistem sadece .edu ve .edu.tr uzantılı domainleri kabul etmeli.  
  * Supabase Auth modülü üzerinden e-posta doğrulaması yapılmalı.  
  * Başarılı girişte profiles tablosunda kullanıcı oluşturulmalı.

### **EPIC 2: AI Smart Itinerary Engine (Zeki Planlayıcı)**

* **US.2.1:** Bir kullanıcı olarak, bütçeme uygun, saatlik ve harita destekli bir rota almak istiyorum.  
* **Kabul Kriterleri (AC):**  
  * Parametreler: destination, start\_date, end\_date, budget\_tier (Economy, Mid, Comfort), interests (list).  
  * FastAPI, LLM (GPT-4o/Flash) kullanarak **kesinlikle** JSON formatında yanıt dönmeli.  
  * Yanıt içeriği: Aktivite adı, lokasyon koordinatları, tahmini maliyet, ulaşım önerisi.

### **EPIC 3: Askıda Bilet & Kültürel Erişim**

* **US.3.1:** Bir kullanıcı olarak, seyahat ettiğim şehirdeki ücretsiz bilet havuzunu görüp claim etmek istiyorum.  
* **Kabul Kriterleri (AC):**  
  * Biletler kategoriye göre (Müze, Konser, Sergi) filtrelenebilmeli.  
  * Bir bilet claim edildiğinde is\_claimed anlık güncellenmeli (Concurrency Lock).  
  * Kullanıcıya çevrimdışı da görülebilen bir QR/Referans kodu verilmeli.

## **4\. VERİTABANI TASARIMI (SUPABASE / POSTGRESQL)**

\-- Kullanıcı Profilleri  
CREATE TABLE profiles (  
    id UUID PRIMARY KEY REFERENCES auth.users,  
    full\_name TEXT,  
    edu\_email TEXT UNIQUE NOT NULL,  
    university\_name TEXT,  
    points INTEGER DEFAULT 0,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- Seyahat Planları  
CREATE TABLE trips (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    user\_id UUID REFERENCES profiles(id),  
    city\_name TEXT NOT NULL,  
    budget\_limit DECIMAL,  
    itinerary\_data JSONB, \-- AI çıktısının tamamı burada saklanır  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- Askıda Biletler  
CREATE TABLE tickets (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    event\_name TEXT NOT NULL,  
    location\_name TEXT,  
    category TEXT CHECK (category IN ('Museum', 'Concert', 'Art', 'Networking')),  
    claim\_code TEXT UNIQUE,  
    is\_claimed BOOLEAN DEFAULT FALSE,  
    claimed\_by UUID REFERENCES profiles(id),  
    expires\_at TIMESTAMP WITH TIME ZONE  
);

## **5\. TEKNİK MİMARİ VE API UÇ NOKTALARI (FASTAPI)**

### **Mimari Notlar:**

* **FastAPI:** Python tabanlı asenkron backend. Render üzerinde uvicorn ile çalışacak.  
* **AI Integration:** OpenAI API veya Google Gemini API (FastAPI tarafında yönetilecek).  
* **Swift Integration:** URLSession veya Alamofire ile REST API iletişimi.

### **API Endpoints:**

1. POST /auth/verify-edu: E-posta uzantı kontrolü.  
2. POST /itinerary/generate: Kullanıcı tercihlerini alıp AI rotası döner.  
3. GET /tickets/available?city={city}: Şehirdeki boş biletleri listeler.  
4. POST /tickets/claim/{ticket\_id}: Bileti kullanıcı adına rezerve eder.

## **6\. KULLANICI ARAYÜZÜ (UI) VE EKRANLAR (SWIFTUI)**

1. **Onboarding & Auth View:** Modern, minimalist giriş ekranı. Apple ID entegrasyonu \+ Edu Mail input.  
2. **Planner Hub:** Seçim tekerlekleri ve slider'lar ile interaktif seyahat parametreleri girişi.  
3. **Itinerary Timeline:**  
   * Dikey zaman çizgisi.  
   * Her durak için Apple Maps yönlendirme butonu.  
   * Hava durumu (WeatherKit entegrasyonu önerilir).  
4. **Ticket Marketplace:** Kart tabanlı, görsel ağırlıklı bilet listesi.  
5. **Profile & Wallet:** Kaydedilen rotalar ve alınan biletlerin QR kodları.

## **7\. KRİTİK BAŞARI VE KABUL KRİTERLERİ (QA)**

* AI rotası her zaman tutarlı JSON dönmeli (Pydantic validation kullanılacak).  
* Uygulama, internet koptuğunda en son yüklenen rotayı cache'den göstermeli (CoreData/UserDefaults).  
* .edu dışı giriş denemeleri kesinlikle bloklanmalı.

## **8\. FAZLANDIRMA PLANI**

* **Faz 1 (Genişletilmiş MVP):** Yukarıdaki tüm özellikler.  
* **Faz 2:** Travel Buddy eşleşmesi, Acil Durum SOS, Lokal Chatbot.  
* **Faz 3:** In-app ödeme, B2B Sponsor Paneli, Oyunlaştırma.