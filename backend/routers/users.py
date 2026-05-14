from fastapi import APIRouter, Depends, HTTPException, status

from db.supabase import get_admin_client, get_anon_client
from dependencies import get_current_user
from schemas.user import UserProfile, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


async def _fetch_profile(user_id: str) -> UserProfile:
    client = await get_anon_client()
    result = (
        await client.table("profiles").select("*").eq("id", user_id).single().execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )
    return UserProfile(**result.data)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    """
    Return the authenticated user's profile from the `profiles` table.

    Requires a valid `Bearer` token in the `Authorization` header.
    """
    user_id: str = current_user["sub"]
    profile = await _fetch_profile(user_id)
    return UserResponse(data=profile)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
)
async def update_me(
    body: UserUpdate,
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """
    Update `full_name` and/or `university_name` for the authenticated user.

    Only fields that are provided (non-null) will be updated.
    """
    user_id: str = current_user["sub"]
    updates = body.model_dump(exclude_none=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )

    client = await get_anon_client()
    result = (
        await client.table("profiles").update(updates).eq("id", user_id).execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    updated_profile = UserProfile(**result.data[0])
    return UserResponse(data=updated_profile, message="Profile updated successfully.")


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete current user account",
)
async def delete_me(current_user: dict = Depends(get_current_user)) -> None:
    """
    Permanently delete the authenticated user's account and all associated data.

    - Removes the row from `profiles` (cascades to `trips` via FK).
    - Deletes the Supabase Auth identity via the service-role admin client.
    """
    user_id: str = current_user["sub"]
    admin_client = await get_admin_client()
    try:
        await admin_client.auth.admin.delete_user(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account deletion failed: {exc}",
        ) from exc
