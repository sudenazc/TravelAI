from typing import Any

import httpx
from jose import JWTError, jwk, jwt
from jose.utils import base64url_decode

from core.config import get_settings

_jwks_cache: dict[str, Any] | None = None


async def _fetch_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(settings.supabase_jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache


def _get_key_from_jwks(jwks: dict[str, Any], kid: str) -> Any:
    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid:
            return jwk.construct(key_data)
    return None


async def decode_supabase_jwt(token: str) -> dict[str, Any]:
    """Validate a Supabase-issued JWT and return the payload."""
    settings = get_settings()
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise ValueError("Invalid JWT header") from exc

    kid = unverified_header.get("kid")
    if not kid:
        raise ValueError("JWT missing kid header")

    jwks = await _fetch_jwks()
    public_key = _get_key_from_jwks(jwks, kid)

    if public_key is None:
        # Invalidate cache and retry once in case keys were rotated
        global _jwks_cache
        _jwks_cache = None
        jwks = await _fetch_jwks()
        public_key = _get_key_from_jwks(jwks, kid)

    if public_key is None:
        raise ValueError("Matching public key not found in JWKS")

    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=settings.supabase_jwt_aud,
        )
    except JWTError as exc:
        raise ValueError(f"JWT validation failed: {exc}") from exc

    return payload
