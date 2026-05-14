from fastapi import APIRouter, HTTPException, status
from supabase import AsyncClient

from db.supabase import get_anon_client
from schemas.auth import (
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _token_response(session) -> TokenResponse:
    return TokenResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
    )


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Register with a .edu email address",
    response_description="OTP verification email sent",
)
async def signup(body: SignupRequest) -> dict:
    """
    Register a new student account.

    - Accepts only **.edu** / **.edu.XX** email addresses.
    - Sends a **6-digit OTP** to the provided email via Supabase Auth.
    - The account is not active until OTP is verified via `/auth/verify-otp`.
    """
    client: AsyncClient = await get_anon_client()
    try:
        await client.auth.sign_up(
            {
                "email": body.email,
                "password": body.password,
                "options": {
                    "data": {
                        "full_name": body.full_name,
                        "university_name": body.university_name,
                    }
                },
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return {
        "message": "Verification email sent. Please check your inbox for the OTP code."
    }


@router.post(
    "/login",
    summary="Login with email and password",
    response_model=TokenResponse,
)
async def login(body: LoginRequest) -> TokenResponse:
    """
    Authenticate an existing verified student account.

    Returns `access_token` and `refresh_token` on success.
    """
    client: AsyncClient = await get_anon_client()
    try:
        response = await client.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _token_response(response.session)


@router.post(
    "/refresh",
    summary="Refresh access token",
    response_model=TokenResponse,
)
async def refresh_token(body: RefreshRequest) -> TokenResponse:
    """Exchange an expired `access_token` for a new session using a `refresh_token`."""
    client: AsyncClient = await get_anon_client()
    try:
        response = await client.auth.refresh_session(body.refresh_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed.",
        )

    return _token_response(response.session)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout and revoke session",
)
async def logout() -> None:
    """
    Revoke the current Supabase session.

    The client should discard the stored `access_token` and `refresh_token`.
    """
    client: AsyncClient = await get_anon_client()
    try:
        await client.auth.sign_out()
    except Exception:
        pass
