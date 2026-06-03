import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from db.supabase import get_admin_client
from dependencies import get_current_user
from schemas.locals import (
    BookingRequest,
    BookingResponse,
    BookingsListResponse,
    LocalHelperListResponse,
    LocalHelperProfile,
    LocalHelperUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/locals", tags=["Local Helpers"])


@router.put("/profile", response_model=dict)
async def update_local_helper_profile(
    body: LocalHelperUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Toggle local helper status and update helper details on the profile."""
    db = await get_admin_client()

    update_data: dict = {"is_local_helper": body.is_local_helper}

    if body.is_local_helper:
        update_data["helper_region"] = body.helper_region
        update_data["helper_bio"] = body.helper_bio
        update_data["helper_availability"] = body.helper_availability
    else:
        # Clear helper fields when deactivating
        update_data["helper_region"] = None
        update_data["helper_bio"] = None
        update_data["helper_availability"] = None

    result = (
        await db.table("profiles")
        .update(update_data)
        .eq("id", current_user["sub"])
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Call GET /users/me first to create it.",
        )

    return {"message": "Local helper profile updated.", "is_local_helper": body.is_local_helper}


@router.get("", response_model=LocalHelperListResponse)
async def list_local_helpers(
    region: str = Query(..., description="City or region name to search"),
    current_user: dict = Depends(get_current_user),
) -> LocalHelperListResponse:
    """Return active local helpers for a given region (case-insensitive)."""
    db = await get_admin_client()

    result = (
        await db.table("profiles")
        .select("id, full_name, helper_region, helper_bio, helper_availability")
        .eq("is_local_helper", True)
        .ilike("helper_region", f"%{region}%")
        .neq("id", current_user["sub"])
        .execute()
    )

    helpers = [LocalHelperProfile(**row) for row in (result.data or [])]
    return LocalHelperListResponse(data=helpers, total=len(helpers))


@router.post("/book/{helper_id}", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def book_local_helper(
    helper_id: str,
    body: BookingRequest,
    current_user: dict = Depends(get_current_user),
) -> BookingResponse:
    """Create a booking request to a local helper."""
    try:
        uuid.UUID(helper_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid helper_id: must be a valid UUID.",
        )

    requester_id = current_user["sub"]

    if requester_id == helper_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot book yourself.",
        )

    db = await get_admin_client()

    helper_result = (
        await db.table("profiles")
        .select("id, is_local_helper")
        .eq("id", helper_id)
        .eq("is_local_helper", True)
        .single()
        .execute()
    )
    if not helper_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local helper not found or no longer active.",
        )

    row = {
        "requester_id": requester_id,
        "helper_id": helper_id,
        "status": "pending",
    }
    if body.trip_id:
        row["trip_id"] = body.trip_id
    if body.message:
        row["message"] = body.message

    result = await db.table("local_bookings").insert(row).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create booking.",
        )

    saved = result.data[0]
    return BookingResponse(
        id=saved["id"],
        requester_id=saved["requester_id"],
        helper_id=saved["helper_id"],
        trip_id=saved.get("trip_id"),
        message=saved.get("message"),
        status=saved["status"],
        created_at=saved["created_at"],
    )


@router.get("/bookings", response_model=BookingsListResponse)
async def get_my_bookings(
    current_user: dict = Depends(get_current_user),
) -> BookingsListResponse:
    """Return all bookings where the current user is either requester or helper."""
    db = await get_admin_client()
    user_id = current_user["sub"]

    as_requester_result = (
        await db.table("local_bookings")
        .select("*")
        .eq("requester_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    as_helper_result = (
        await db.table("local_bookings")
        .select("*")
        .eq("helper_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    def _parse(rows: list[dict]) -> list[BookingResponse]:
        return [
            BookingResponse(
                id=r["id"],
                requester_id=r["requester_id"],
                helper_id=r["helper_id"],
                trip_id=r.get("trip_id"),
                message=r.get("message"),
                status=r["status"],
                created_at=r["created_at"],
            )
            for r in rows
        ]

    return BookingsListResponse(
        as_requester=_parse(as_requester_result.data or []),
        as_helper=_parse(as_helper_result.data or []),
    )
