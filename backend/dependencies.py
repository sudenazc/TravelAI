from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db.supabase import get_anon_client

_bearer_scheme = HTTPBearer()


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
