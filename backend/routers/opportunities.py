import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from postgrest.exceptions import APIError as PostgrestAPIError

from db.supabase import get_admin_client
from dependencies import get_current_user
from schemas.opportunities import (
    ClaimedOpportunityResponse,
    OpportunityCategory,
    OpportunityResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


def _row_to_opportunity(row: dict) -> OpportunityResponse:
    return OpportunityResponse(
        id=row["id"],
        title=row["title"],
        description=row.get("description"),
        city=row["city"],
        category=row["category"],
        provider_name=row.get("provider_name"),
        original_price=float(row["original_price"]) if row.get("original_price") is not None else None,
        offer_price=float(row["offer_price"]) if row.get("offer_price") is not None else None,
        is_free=row["is_free"],
        status=row["status"],
        is_last_minute=row["is_last_minute"],
        expires_at=row.get("expires_at"),
        event_date=row.get("event_date"),
    )


def _row_to_claimed(row: dict) -> ClaimedOpportunityResponse:
    return ClaimedOpportunityResponse(
        **_row_to_opportunity(row).model_dump(),
        claim_code=row.get("claim_code"),
    )


@router.get("", response_model=list[OpportunityResponse])
async def list_opportunities(
    city: str | None = Query(None, description="Filter by city name (case-insensitive)"),
    category: OpportunityCategory | None = Query(None, description="Filter by category"),
) -> list[OpportunityResponse]:
    """Return available opportunities, optionally filtered by city and/or category."""
    db = await get_admin_client()
    try:
        query = db.table("opportunities").select("*").eq("status", "available")
        if city:
            query = query.ilike("city", f"%{city}%")
        if category:
            query = query.eq("category", category)
        result = await query.order("is_last_minute", desc=True).order("created_at").execute()
    except PostgrestAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Opportunities are temporarily unavailable: {exc.message}",
        ) from exc

    return [_row_to_opportunity(row) for row in result.data or []]


@router.post(
    "/claim/{opportunity_id}",
    response_model=ClaimedOpportunityResponse,
    status_code=status.HTTP_200_OK,
)
async def claim_opportunity(
    opportunity_id: str,
    current_user: dict = Depends(get_current_user),
) -> ClaimedOpportunityResponse:
    """Atomically claim an opportunity. Fails with 409 if already claimed."""
    db = await get_admin_client()
    user_id = current_user["sub"]

    # Fetch the opportunity first to give meaningful error messages
    try:
        fetch_result = (
            await db.table("opportunities")
            .select("*")
            .eq("id", opportunity_id)
            .single()
            .execute()
        )
    except PostgrestAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Opportunities are temporarily unavailable: {exc.message}",
        ) from exc

    if not fetch_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")

    row = fetch_result.data

    if row["status"] != "available":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This opportunity has already been claimed or has expired.",
        )

    # Atomic claim: update only if claimed_by is still NULL (concurrency lock)
    try:
        update_result = (
            await db.table("opportunities")
            .update({"claimed_by": user_id, "status": "claimed"})
            .eq("id", opportunity_id)
            .is_("claimed_by", "null")
            .execute()
        )
    except PostgrestAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not process claim: {exc.message}",
        ) from exc

    if not update_result.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This opportunity was just claimed by someone else.",
        )

    return _row_to_claimed(update_result.data[0])


@router.get("/wallet", response_model=list[ClaimedOpportunityResponse])
async def get_wallet(
    current_user: dict = Depends(get_current_user),
) -> list[ClaimedOpportunityResponse]:
    """Return all opportunities claimed by the authenticated user."""
    db = await get_admin_client()
    user_id = current_user["sub"]

    try:
        result = (
            await db.table("opportunities")
            .select("*")
            .eq("claimed_by", user_id)
            .eq("status", "claimed")
            .order("created_at", desc=True)
            .execute()
        )
    except PostgrestAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Wallet is temporarily unavailable: {exc.message}",
        ) from exc

    return [_row_to_claimed(row) for row in result.data or []]
