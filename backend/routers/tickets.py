import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from postgrest.exceptions import APIError as PostgrestAPIError

from db.supabase import get_admin_client
from dependencies import get_current_user
from schemas.tickets import (
    EventCategory,
    EventResponse,
    OwnedTicketResponse,
    PurchaseTicketRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("/events", response_model=list[EventResponse])
async def list_events(
    category: EventCategory | None = Query(None, description="Filter by category"),
) -> list[EventResponse]:
    """Return available events, optionally filtered by category."""
    db = await get_admin_client()
    try:
        query = db.table("events").select("*").eq("is_active", True)
        if category:
            query = query.eq("category", category)
        result = await query.order("date").execute()
    except PostgrestAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Events are temporarily unavailable: {exc.message}",
        ) from exc

    return [
        EventResponse(
            id=row["id"],
            title=row["title"],
            category=row["category"],
            image_url=row["image_url"],
            date=row["date"],
            time=row["time"],
            location=row["location"],
            price_usd=float(row["price_usd"]),
            spots_left=row.get("spots_left"),
        )
        for row in result.data or []
    ]


@router.post("/purchase", response_model=OwnedTicketResponse, status_code=status.HTTP_201_CREATED)
async def purchase_ticket(
    req: PurchaseTicketRequest,
    current_user: dict = Depends(get_current_user),
) -> OwnedTicketResponse:
    """Purchase a ticket for an event."""
    db = await get_admin_client()
    try:
        event_result = (
            await db.table("events")
            .select("*")
            .eq("id", req.event_id)
            .eq("is_active", True)
            .single()
            .execute()
        )
    except PostgrestAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Events are temporarily unavailable: {exc.message}",
        ) from exc

    if not event_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    event = event_result.data

    if event.get("spots_left") is not None and event["spots_left"] <= 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No spots left for this event.")

    await db.table("profiles").upsert(
        {"id": current_user["sub"], "edu_email": current_user["email"]},
        on_conflict="id",
    ).execute()

    try:
        ticket_result = await db.table("tickets").insert(
            {
                "user_id": current_user["sub"],
                "event_id": req.event_id,
                "status": "upcoming",
            }
        ).execute()
    except PostgrestAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Tickets are temporarily unavailable: {exc.message}",
        ) from exc

    if not ticket_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save ticket.",
        )

    if event.get("spots_left") is not None:
        await db.table("events").update(
            {"spots_left": max(0, event["spots_left"] - 1)}
        ).eq("id", req.event_id).execute()

    saved = ticket_result.data[0]
    return OwnedTicketResponse(
        id=saved["id"],
        event_id=saved["event_id"],
        event_title=event["title"],
        date=event["date"],
        location=event["location"],
        status=saved["status"],
        purchased_at=saved["purchased_at"],
    )


@router.get("", response_model=list[OwnedTicketResponse])
async def list_owned_tickets(
    current_user: dict = Depends(get_current_user),
) -> list[OwnedTicketResponse]:
    """Return all tickets owned by the authenticated user."""
    db = await get_admin_client()
    try:
        result = (
            await db.table("tickets")
            .select("*, events(title, date, location)")
            .eq("user_id", current_user["sub"])
            .order("purchased_at", desc=True)
            .execute()
        )
    except PostgrestAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Tickets are temporarily unavailable: {exc.message}",
        ) from exc

    tickets: list[OwnedTicketResponse] = []
    for row in result.data or []:
        event = row.get("events") or {}
        tickets.append(
            OwnedTicketResponse(
                id=row["id"],
                event_id=row["event_id"],
                event_title=event.get("title", ""),
                date=event.get("date", ""),
                location=event.get("location", ""),
                status=row["status"],
                purchased_at=row["purchased_at"],
            )
        )
    return tickets
