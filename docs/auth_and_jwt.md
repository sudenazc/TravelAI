# Auth & JWT (Supabase) — Backend doğrulama yaklaşımı

## Token kaynağı

- Web (Next.js) ve iOS, Supabase Auth üzerinden login olur.
- API çağrılarında `Authorization: Bearer <access_token>` gönderir.

## Backend (FastAPI) doğrulama

- Backend **Supabase access token**’ını doğrular.
- Yaklaşım:
  - JWT header’daki `kid` ile Supabase’in JWKS’inden public key seçilir.
  - İmza doğrulaması + `iss`, `aud`, `exp` kontrolü yapılır.
  - Başarılıysa `sub` (user id) → `auth.uid()` eşleniği olarak kullanılır.

## Ortam değişkenleri

- `SUPABASE_URL`
- `SUPABASE_JWT_AUD` (genelde `authenticated`)
- `SUPABASE_JWKS_URL` (türetilir: `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)

## Not

- Bu aşamada backend “login” yapmaz; sadece gelen token’ı doğrular.

