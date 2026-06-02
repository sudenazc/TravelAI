# Travel AI — Design System & UI/UX Kılavuzu

> **Versiyon:** 1.0  
> **Tarih:** Nisan 2026  
> **Yaklaşım:** Mobile-First, Responsive Web  
> **Referans Renk:** `#bfdbfe`

Bu dosya Travel AI uygulamasının **tek gerçek kaynak (single source of truth)** tasarım sistemidir. Yeni ekran, bileşen, tema/token veya stil değişikliği yapmadan önce bu dokümanla hizalama yapılmalıdır. Güncelleme gerektiğinde versiyon numarası artırılmalı ve değişiklik logu tutulmalıdır.

---

## İçindekiler

1. [Renk Paleti](#renk-paleti)
2. [Tipografi](#tipografi)
3. [Boşluk & Grid Sistemi](#boşluk--grid-sistemi)
4. [Köşe Yarıçapları & Gölgeler](#köşe-yarıçapları--gölgeler)
5. [Komponent Kütüphanesi](#komponent-kütüphanesi)
6. [Sayfa Şablonları](#sayfa-şablonları)
7. [İkonografi & Görsel Dil](#ikonografi--görsel-dil)
8. [Animasyon & Etkileşim](#animasyon--etkileşim)
9. [Erişilebilirlik](#erişilebilirlik)
10. [Mobile-First Breakpoint'ler](#mobile-first-breakpointler)

---

## Renk Paleti

### Ana Renk — Sky Blue (`#bfdbfe` temelli)

Temel renk olan `#bfdbfe` üzerinden oluşturulan 11 tonluk tam palet. Her ton, bir öncekinden yaklaşık %12–15 daha koyu veya açıktır.

| Token | Hex | RGB | Kullanım |
|---|---|---|---|
| `sky-50` | `#f0f7ff` | rgb(240, 247, 255) | Sayfa arkaplanı, hover bg |
| `sky-100` | `#dbeefe` | rgb(219, 238, 254) | Kart arkaplanı, subtle bg |
| `sky-200` | `#bfdbfe` | rgb(191, 219, 254) | **Ana marka rengi**, badge bg |
| `sky-300` | `#93c5fd` | rgb(147, 197, 253) | İkincil vurgu, border |
| `sky-400` | `#60a5fa` | rgb(96, 165, 250) | Buton hover, aktif state |
| `sky-500` | `#3b82f6` | rgb(59, 130, 246) | Primary buton, link |
| `sky-600` | `#2563eb` | rgb(37, 99, 235) | Buton pressed, CTA |
| `sky-700` | `#1d4ed8` | rgb(29, 78, 216) | Koyu vurgu, heading accent |
| `sky-800` | `#1e40af` | rgb(30, 64, 175) | Footer, dark section |
| `sky-900` | `#1e3a8a` | rgb(30, 58, 138) | Dark mode primary |
| `sky-950` | `#172554` | rgb(23, 37, 84) | En koyu ton, metin üstü |

### Nötr Renkler — Slate

| Token | Hex | Kullanım |
|---|---|---|
| `neutral-0` | `#ffffff` | Kart yüzeyi, modal bg |
| `neutral-50` | `#f8fafc` | Sayfa arkaplanı |
| `neutral-100` | `#f1f5f9` | Input bg, bölücü |
| `neutral-200` | `#e2e8f0` | Border, divider |
| `neutral-300` | `#cbd5e1` | Placeholder, disabled border |
| `neutral-400` | `#94a3b8` | Placeholder text, icon |
| `neutral-500` | `#64748b` | Secondary text |
| `neutral-600` | `#475569` | Body text |
| `neutral-700` | `#334155` | Heading text |
| `neutral-800` | `#1e293b` | Primary text |
| `neutral-900` | `#0f172a` | Display heading |

### Anlamsal Renkler

| Token | Hex | Kullanım |
|---|---|---|
| `success-100` | `#dcfce7` | Başarı arka planı |
| `success-600` | `#16a34a` | Başarı ikonu, text |
| `warning-100` | `#fef9c3` | Uyarı arka planı |
| `warning-600` | `#ca8a04` | Uyarı ikonu, text |
| `error-100` | `#fee2e2` | Hata arka planı |
| `error-600` | `#dc2626` | Hata ikonu, text |
| `info-100` | `#dbeefe` | Bilgi arka planı |
| `info-600` | `#2563eb` | Bilgi ikonu, text |

### Renk Kullanım Kuralları

```
Arkaplan hiyerarşisi (açıktan koyuya):
  neutral-50 → Sayfa
  neutral-0  → Kart / Panel
  sky-50     → İç içe kart / hover

Metin hiyerarşisi:
  neutral-900 → H1, display
  neutral-800 → H2, H3, body-bold
  neutral-600 → Body, paragraf
  neutral-400 → Caption, placeholder
  sky-600     → Link, aktif nav

Border:
  neutral-200 → Varsayılan
  sky-300     → Focus ring (2px offset)
  sky-500     → Aktif / seçili border
```

### Gradyanlar

```css
/* Hero gradient */
--gradient-hero: linear-gradient(135deg, #f0f7ff 0%, #bfdbfe 50%, #93c5fd 100%);

/* Kart overlay (fotoğraf üstü) */
--gradient-card-overlay: linear-gradient(to top, rgba(23,37,84,0.8) 0%, transparent 60%);

/* CTA buton */
--gradient-cta: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);

/* Açık vurgu */
--gradient-subtle: linear-gradient(135deg, #f0f7ff 0%, #dbeefe 100%);
```

---

## Tipografi

### Font Ailesi

```css
/* Ana font — başlıklar, UI elemanları */
--font-display: 'Plus Jakarta Sans', sans-serif;

/* Gövde metni */
--font-body: 'Inter', sans-serif;

/* Monospace — kod, koordinat, tarih kodu */
--font-mono: 'JetBrains Mono', monospace;
```

> **Google Fonts import:** `Plus Jakarta Sans` (300, 400, 500, 600, 700, 800) + `Inter` (400, 500, 600)

### Tip Skalası

| Token | Size | Line-height | Weight | Kullanım |
|---|---|---|---|---|
| `text-display-2xl` | 72px / 4.5rem | 1.1 | 800 | Hero başlık (desktop) |
| `text-display-xl` | 60px / 3.75rem | 1.15 | 800 | Hero başlık (tablet) |
| `text-display-lg` | 48px / 3rem | 1.2 | 700 | Bölüm başlığı |
| `text-display-md` | 36px / 2.25rem | 1.25 | 700 | Kart başlığı büyük |
| `text-display-sm` | 30px / 1.875rem | 1.3 | 600 | Sayfa başlığı |
| `text-xl` | 20px / 1.25rem | 1.4 | 600 | Kart başlığı |
| `text-lg` | 18px / 1.125rem | 1.5 | 500 | Lead paragraph |
| `text-md` | 16px / 1rem | 1.6 | 400 | Body varsayılan |
| `text-sm` | 14px / 0.875rem | 1.5 | 400 | Secondary, label |
| `text-xs` | 12px / 0.75rem | 1.4 | 500 | Badge, caption |
| `text-2xs` | 10px / 0.625rem | 1.4 | 600 | Tag, eyebrow |

### Mobilde Tip Skalası (max-width: 768px)

| Desktop Token | Mobil Boyut |
|---|---|
| `text-display-2xl` | 40px |
| `text-display-xl` | 36px |
| `text-display-lg` | 30px |
| `text-display-md` | 24px |
| `text-display-sm` | 22px |

---

## Boşluk & Grid Sistemi

### Boşluk Skalası (4px tabanlı)

```
spacing-0   →  0px
spacing-1   →  4px
spacing-2   →  8px
spacing-3   →  12px
spacing-4   →  16px
spacing-5   →  20px
spacing-6   →  24px
spacing-8   →  32px
spacing-10  →  40px
spacing-12  →  48px
spacing-16  →  64px
spacing-20  →  80px
spacing-24  →  96px
spacing-32  →  128px
```

### Grid Sistemi

| Breakpoint | Sütun | Gutter | Margin | Max Container |
|---|---|---|---|---|
| `xs` 0–375px | 4 sütun | 12px | 16px | fluid |
| `sm` 376–640px | 4 sütun | 16px | 24px | fluid |
| `md` 641–768px | 8 sütun | 20px | 32px | fluid |
| `lg` 769–1024px | 12 sütun | 24px | 40px | fluid |
| `xl` 1025–1280px | 12 sütun | 24px | auto | 1200px |
| `2xl` 1281px+ | 12 sütun | 32px | auto | 1440px |

### Layout Bölgeleri

```
Mobile (< 768px):
┌─────────────────────┐
│      Top Nav        │  ← 56px sabit
├─────────────────────┤
│    Hero / Content   │
├─────────────────────┤
│   Bottom Tab Bar    │  ← 64px + safe area
└─────────────────────┘

Desktop (≥ 1024px):
┌────┬────────────────┐
│    │   Top Nav      │  ← 72px sabit
│    ├────────────────┤
│Side│   Main Area    │
│bar │                │
│240 │                │
│px  │                │
└────┴────────────────┘
```

---

## Köşe Yarıçapları & Gölgeler

### Border Radius

```css
--radius-xs:   4px;   /* Input, badge küçük */
--radius-sm:   8px;   /* Chip, tag */
--radius-md:   12px;  /* Kart küçük, buton */
--radius-lg:   16px;  /* Kart standart */
--radius-xl:   20px;  /* Modal, drawer */
--radius-2xl:  24px;  /* Hero kart, büyük panel */
--radius-3xl:  32px;  /* Floating card */
--radius-full: 9999px; /* Pill buton, avatar */
```

### Gölge Sistemi

```css
/* Kart hover yok */
--shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.06);

/* Kart varsayılan */
--shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.08),
             0 1px 2px rgba(15, 23, 42, 0.04);

/* Kart hover / odak */
--shadow-md: 0 4px 16px rgba(59, 130, 246, 0.12),
             0 2px 6px rgba(15, 23, 42, 0.06);

/* Modal, dropdown */
--shadow-lg: 0 8px 32px rgba(15, 23, 42, 0.12),
             0 4px 12px rgba(15, 23, 42, 0.06);

/* Floating buton, tooltip */
--shadow-xl: 0 16px 48px rgba(15, 23, 42, 0.16),
             0 6px 16px rgba(15, 23, 42, 0.08);

/* Mavi ton gölge — CTA buton */
--shadow-brand: 0 8px 24px rgba(59, 130, 246, 0.32);
```

---

## Komponent Kütüphanesi

### 1. Butonlar

#### Primary Button
```
Arkaplan  : sky-500 → hover: sky-600 → pressed: sky-700
Metin     : white, font-weight: 600, text-sm
Padding   : 10px 20px (sm) | 12px 24px (md) | 14px 28px (lg)
Radius    : radius-md (12px)
Shadow    : shadow-brand (hover'da)
```

#### Secondary Button
```
Arkaplan  : white
Border    : 1.5px solid neutral-200 → hover: sky-300
Metin     : neutral-700 → hover: sky-600
```

#### Ghost Button
```
Arkaplan  : transparent → hover: sky-50
Metin     : sky-600
```

#### Pill / CTA Büyük
```
Arkaplan  : gradient-cta
Metin     : white, font-weight: 700, text-lg
Padding   : 16px 36px
Radius    : radius-full
Shadow    : shadow-brand
```

#### Buton Boyutları

| Boyut | Height | Padding X | Font |
|---|---|---|---|
| `sm` | 32px | 14px | 13px |
| `md` | 40px | 20px | 14px |
| `lg` | 48px | 24px | 16px |
| `xl` | 56px | 32px | 18px |

---

### 2. Input & Form Elemanları

#### Text Input
```
Height    : 44px (mobile uyumlu, min touch target)
Padding   : 0 16px
Border    : 1.5px solid neutral-200
Radius    : radius-md
Arkaplan  : neutral-0
Font      : text-md, neutral-800

Focus     : border-color: sky-500, ring: 3px sky-200
Error     : border-color: error-600, ring: 3px error-100
Success   : border-color: success-600
```

#### Search Input (AI Chat Arama Çubuğu)
```
Height    : 56px (desktop) / 48px (mobile)
Padding   : 0 20px 0 48px (sol ikon için)
Border    : 2px solid sky-200
Radius    : radius-full
Shadow    : shadow-sm
Arkaplan  : white

İkon      : arama ikonu, neutral-400, 20px
Submit    : pill buton, sağda, sky-500
```

#### Date Picker Chip
```
Padding   : 8px 14px
Border    : 1.5px solid neutral-200 → seçili: sky-500
Radius    : radius-sm
Arkaplan  : seçili: sky-50
Metin     : text-sm, font-weight: 500
```

---

### 3. Kart Bileşenleri

#### Destination Card (Hedef Yeri Kartı)
```
Boyut     : 280×200px (desktop) / tam genişlik (mobile)
Radius    : radius-xl
Overflow  : hidden
Arkaplan  : fotoğraf + gradient-card-overlay

İçerik (alt kısım):
  - Şehir adı : text-xl, white, font-weight: 700
  - Ülke      : text-sm, sky-200
  - "Plan it →": text-xs, white, opacity: 0.85
```

#### Trip Card (Gezi Özet Kartı)
```
Padding   : 20px
Radius    : radius-xl
Border    : 1px solid neutral-100
Shadow    : shadow-sm → hover: shadow-md
Arkaplan  : white → hover: sky-50 (transition 200ms)

Üst kısım : thumbnail (16:9), radius-lg
Alt kısım :
  - Başlık   : text-xl, neutral-900, font-weight: 700
  - Tarih    : text-sm, neutral-500, ikon ile
  - Fiyat    : text-lg, sky-600, font-weight: 700
  - Badge    : sky-200 bg, sky-700 text
```

#### Itinerary Day Card (Gün Kartı)
```
Padding   : 16px
Radius    : radius-lg
Border    : 1px solid neutral-100
Sol çizgi : 3px solid sky-400 (aktif gün)

Gün no    : text-2xs, sky-600, eyebrow, uppercase, letter-spacing: 0.08em
Başlık    : text-lg, neutral-900, font-weight: 600
Aktivite  : her biri ayrı satır, ikon + text-sm + saat
```

#### Flight Card (Uçuş Kartı)
```
Padding   : 16px 20px
Radius    : radius-lg
Border    : 1px solid neutral-200
İç grid   : 3 sütun (kalkış | uçuş bilgisi | varış)

Havayolu  : logo 24px + text-xs, neutral-500
Saat      : text-display-sm, neutral-900, font-weight: 700
Havalimanı: text-xs, neutral-400, IATA kodu
Süre      : text-sm, neutral-600, orta
Fiyat     : text-xl, sky-600, font-weight: 700 (sağ alt)
```

#### Hotel Card (Otel Kartı)
```
Yatay düzen: thumbnail (120px geniş) + içerik
Fotoğraf  : radius-lg, object-fit: cover
Yıldız    : icon-star, warning-600, text-xs
Puan      : text-sm, font-weight: 700 + "Çok İyi" text-xs neutral-500
Fiyat     : text-lg, sky-600 + "/gece" text-sm neutral-400
```

---

### 4. Navigasyon

#### Top Navigation (Desktop)
```
Height    : 72px
Arkaplan  : white / backdrop-blur + rgba(255,255,255,0.9)
Border-b  : 1px solid neutral-100
Shadow    : shadow-xs

Sol       : Logo (28px yükseklik)
Orta      : Nav linkleri — text-sm, font-weight: 500, neutral-600
            Aktif: sky-600, alt çizgi 2px sky-500
Sağ       : Login + CTA pill butonu
```

#### Top Navigation (Mobile)
```
Height    : 56px
Arkaplan  : white
Padding   : 0 16px
İçerik    : Logo sol | Hamburger sağ (24px ikon)
```

#### Bottom Tab Bar (Mobile)
```
Height    : 64px + safe-area-inset-bottom
Arkaplan  : white
Border-t  : 1px solid neutral-100
Shadow    : 0 -4px 12px rgba(0,0,0,0.06)

Sekmeler  : 5 adet (max), eşit genişlik
Aktif ikon: sky-600, filled
Pasif ikon: neutral-400, outlined
Etiket    : text-2xs, aktif: sky-600, pasif: neutral-400
```

---

### 5. AI Chat Arayüzü

#### Chat Container
```
Genişlik  : 420px (desktop panel) / tam ekran (mobile)
Arkaplan  : neutral-50
Radius    : radius-2xl (desktop)
Overflow  : hidden
```

#### AI Mesaj Balonu
```
Arkaplan  : white
Border    : 1px solid neutral-100
Radius    : 0 radius-xl radius-xl radius-xl
Padding   : 14px 18px
Shadow    : shadow-xs
Font      : text-md, neutral-700
Max-width : 85%

Avatar    : 32px, sky-500 arkaplan, AI ikonu, radius-full
```

#### Kullanıcı Mesaj Balonu
```
Arkaplan  : sky-500
Radius    : radius-xl radius-xl 0 radius-xl
Padding   : 14px 18px
Font      : text-md, white
Max-width : 85%
Sağa hizalı
```

#### Suggestion Chips (Öneri Yongaları)
```
Padding   : 8px 16px
Radius    : radius-full
Border    : 1.5px solid sky-300
Arkaplan  : sky-50
Metin     : text-sm, sky-700, font-weight: 500
Gap       : 8px, yatay scroll (mobile)
Hover     : arkaplan sky-100, border sky-500
```

---

### 6. Map & Timeline

#### Harita Kartı
```
Aspect    : 16:9 (desktop) / 4:3 (mobile)
Radius    : radius-xl
Overflow  : hidden

Pin       : sky-600 fill, beyaz border 2px, gölge
Aktif pin : sky-500, scale 1.2, shadow-brand
```

#### Timeline (Gün Zaman Çizelgesi)
```
Sol çizgi : 2px solid sky-200
Nokta     : 10px, sky-500, radius-full, beyaz iç
Aktif nokta: 14px, sky-600, ring: 3px sky-200

Zaman     : text-xs, neutral-400, font-mono
Aktivite  : text-sm, neutral-800, font-weight: 500
Konum     : text-xs, neutral-500, ikon-pin ile
```

---

### 7. Badge & Etiket

```
Boyut     : padding 2px 10px, text-xs, radius-full

Varyantlar:
  primary  : sky-100 bg, sky-700 text
  success  : success-100 bg, success-600 text
  warning  : warning-100 bg, warning-600 text
  error    : error-100 bg, error-600 text
  neutral  : neutral-100 bg, neutral-600 text
  dark     : neutral-800 bg, white text
```

---

### 8. Rating & Yıldız

```
Yıldız ikonu : 14px (small) / 16px (default) / 20px (large)
Dolu yıldız  : warning-500 (#eab308)
Boş yıldız   : neutral-200
Yarım yıldız : gradient (dolu/boş)

Puan metni   : font-weight: 700
Yorum sayısı : neutral-400, parantez içinde
```

---

### 9. Loading & Skeleton

```css
/* Skeleton animasyonu */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

---

## Sayfa Şablonları

### Landing Page Yapısı

```
1. Hero Section
   ├── Slogan (display-2xl)
   ├── Alt başlık (text-lg, neutral-500)
   ├── AI arama çubuğu (büyük, tam genişlik)
   ├── Hızlı filtre chipları (popüler destinasyonlar)
   └── Hero görsel / illustrasyon

2. Stats Bar
   ├── "1.8M+ Gezi Planlandı"
   └── Güvenilir logo şeridi

3. Hedef Kartları Grid
   ├── Başlık + "Tümünü Gör" CTA
   └── Yatay scroll (mobile) / 3-4 sütun (desktop)

4. Nasıl Çalışır (3 adım)
   ├── Adım ikonu (sky-100 bg, sky-600 ikon)
   ├── Başlık + açıklama
   └── Ok bağlayıcı (desktop)

5. Örnek Gezi Planı (Interactive Demo)

6. Sosyal Kanıt
   ├── Güven edilen partnerler logoları
   └── Kullanıcı yorumları carousel

7. Footer
   ├── Arkaplan: neutral-900
   ├── Link grupları (4 sütun desktop / 2 sütun mobile)
   └── Alt çizgi: telif, sosyal medya ikonları
```

### Trip Planner Sayfası Yapısı

```
Desktop (yan yana):
┌──────────────────┬──────────────────────────────┐
│  AI Sohbet       │   Gezi Detayları             │
│  Panel (420px)   │                              │
│                  │  ┌──── Başlık + Meta ───┐    │
│  [Mesajlar]      │  │ 8 Gün · Tokyo+Kyoto  │    │
│                  │  └──────────────────────┘    │
│                  │                              │
│  [Öneri Chips]   │  ┌── Harita ──────────┐      │
│                  │  └────────────────────┘      │
│  [Input Alanı]   │                              │
│                  │  [Gün Sekmeler Tab]           │
└──────────────────│  [Gün Kart Listesi]          │
                   └──────────────────────────────┘

Mobile (tek sütun, tab geçişi):
┌─────────────────────┐
│  [Üst Tab: Plan/Map/Chat] │
├─────────────────────┤
│  İçerik alanı        │
│  (seçilen sekmeye    │
│   göre değişir)      │
├─────────────────────┤
│  [Bottom Tab Bar]    │
└─────────────────────┘
```

---

## İkonografi & Görsel Dil

### İkon Seti

- **Birincil:** Lucide Icons (outline style, 20px varsayılan, stroke-width: 1.75)
- **Doldurulmuş:** Yalnızca aktif durum ve önemli aksiyon ikonları
- **Boyutlar:** 16px (inline), 20px (buton/liste), 24px (nav/header), 32px (kart özellik)

### Seyahat İkon Seti (Temel)

```
✈ uçak          → uçuş kartları, başlık
🏨 otel          → konaklama bölümü
🗺️ harita        → harita butonu, navigasyon
📅 takvim        → tarih seçici
🕐 saat          → süre, zaman
👥 kişi          → yolcu sayısı
💰 para          → fiyat, bütçe
⭐ yıldız        → değerlendirme
📍 konum         → adres, harita pin
🔍 arama         → arama çubuğu
💬 sohbet        → AI chat
```

### Fotoğraf Kuralları

```
Destinasyon görselleri:
  - En boy oranı: 4:3 (kart) / 16:9 (hero)
  - Overlay: gradient-card-overlay (alt metin okunabilirliği)
  - Yükleme: blur-up (düşük kalite → yüksek kalite geçiş)

Avatar / profil:
  - radius-full, border: 2px white
  - Fallback: baş harfler, sky-400 arkaplan
```

---

## Animasyon & Etkileşim

### Geçiş Süreleri

```css
--duration-fast:    100ms;  /* Tooltip, ripple */
--duration-normal:  200ms;  /* Hover, focus */
--duration-slow:    300ms;  /* Kart açılma, modal */
--duration-slower:  500ms;  /* Sayfa geçişi, hero */
```

### Easing Fonksiyonları

```css
--ease-out:       cubic-bezier(0.0, 0.0, 0.2, 1);  /* Enter animasyonu */
--ease-in:        cubic-bezier(0.4, 0.0, 1, 1);    /* Exit animasyonu */
--ease-in-out:    cubic-bezier(0.4, 0.0, 0.2, 1);  /* Pozisyon değişimi */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1); /* Zıplayan */
```

### Mikro-etkileşimler

```
Kart hover    → translateY(-4px) + shadow-md, 200ms ease-out
Buton hover   → scale(1.02), 100ms ease-out
Buton press   → scale(0.98), 100ms ease-in
Pin tıklanma  → scale bounce (1→1.3→1), 300ms spring
Mesaj gönder  → slideInUp + fadeIn, 200ms ease-out
Skeleton → İçerik geçişi → fadeIn, 300ms ease-out
Sayfa geçişi  → slideInRight, 300ms ease-in-out
```

---

## Erişilebilirlik

### Renk Kontrastı (WCAG 2.1 AA)

| Kombinasyon | Oran | Durum |
|---|---|---|
| neutral-900 / neutral-0 | 16.7:1 | AAA |
| neutral-600 / neutral-0 | 5.9:1 | AA |
| sky-600 / neutral-0 | 4.7:1 | AA |
| sky-500 / neutral-0 | 3.2:1 | Yalnızca büyük metin |
| white / sky-500 | 3.2:1 | Buton: büyük+bold OK |
| white / sky-600 | 4.7:1 | AA |

### Dokunma Hedefleri

```
Minimum boyut : 44×44px (iOS / Android kılavuzu)
Önerilen      : 48×48px
Boşluk gap    : minimum 8px aralarında
```

### Focus Yönetimi

```css
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 3px;
  border-radius: inherit;
}
```

---

## Mobile-First Breakpoint'ler

### CSS Değişkenleri

```css
/* Breakpoint'ler (min-width bazlı) */
--bp-sm:  375px;   /* Küçük telefon */
--bp-md:  640px;   /* Büyük telefon / küçük tablet */
--bp-lg:  768px;   /* Tablet */
--bp-xl:  1024px;  /* Laptop */
--bp-2xl: 1280px;  /* Desktop */
--bp-3xl: 1440px;  /* Geniş ekran */
```

### Tailwind Config

```js
module.exports = {
  theme: {
    screens: {
      sm:  '375px',
      md:  '640px',
      lg:  '768px',
      xl:  '1024px',
      '2xl': '1280px',
      '3xl': '1440px',
    },
    extend: {
      colors: {
        sky: {
          50:  '#f0f7ff',
          100: '#dbeefe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xs':   '4px',
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '20px',
        '2xl':  '24px',
        '3xl':  '32px',
      },
    },
  },
}
```

### Responsive Komponent Kuralları

```
Navigation:
  mobile  → bottom tab bar (5 sekme)
  desktop → top nav + sidebar

Kart grid:
  mobile  → 1 sütun (veya yatay scroll)
  md      → 2 sütun
  lg      → 3 sütun
  xl      → 4 sütun

Trip Planner:
  mobile  → tab geçişli (Chat / Plan / Harita)
  desktop → yan yana (sol panel + sağ detay)

Font boyutu:
  Her display boyutu mobilde ~0.6–0.75 oranıyla küçülür
  Body ve UI metinleri sabit kalır (min: 14px)

Harita:
  mobile  → fullscreen modal
  desktop → satır içi, sabit yükseklik
```

---

## Dosya & Klasör Yapısı

```
src/
├── design-tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── shadows.ts
├── components/
│   ├── ui/           ← Atom bileşenler (Button, Input, Badge...)
│   ├── cards/        ← Kart bileşenleri
│   ├── navigation/   ← Nav, Tabs, Breadcrumb
│   ├── chat/         ← AI chat arayüzü
│   └── layout/       ← Container, Grid, Stack
├── pages/
│   ├── home/
│   ├── planner/
│   ├── destination/
│   └── account/
└── styles/
    ├── globals.css
    └── tokens.css
```
