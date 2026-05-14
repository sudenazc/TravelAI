from functools import lru_cache

from supabase import AsyncClient, acreate_client

from core.config import get_settings

_anon_client: AsyncClient | None = None
_admin_client: AsyncClient | None = None


async def get_anon_client() -> AsyncClient:
    """Return a shared anon-key Supabase client (respects RLS)."""
    global _anon_client
    if _anon_client is None:
        settings = get_settings()
        _anon_client = await acreate_client(
            settings.supabase_url,
            settings.supabase_anon_key,
        )
    return _anon_client


async def get_admin_client() -> AsyncClient:
    """Return a shared service-role Supabase client (bypasses RLS)."""
    global _admin_client
    if _admin_client is None:
        settings = get_settings()
        _admin_client = await acreate_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _admin_client
