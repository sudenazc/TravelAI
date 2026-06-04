from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db.supabase import get_anon_client

_bearer_scheme = HTTPBearer()
_bearer_scheme_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    """
    Validate the Supabase Bearer token via the Supabase Auth API and return
    a minimal user dict containing at least ``sub`` (user UUID) and ``email``.
    """
    token = credentials.credentials
    try:
        client = await get_anon_client()
        response = await client.auth.get_user(token)
        if not response.user:
            raise ValueError("Token is invalid or has expired.")
        user = response.user
        return {"sub": str(user.id), "email": user.email}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme_optional),
) -> dict | None:
    """Like get_current_user but returns None instead of raising 401 when no token is provided."""
    if not credentials:
        return None
    try:
        client = await get_anon_client()
        response = await client.auth.get_user(credentials.credentials)
        if not response.user:
            return None
        user = response.user
        return {"sub": str(user.id), "email": user.email}
    except Exception:
        return None
