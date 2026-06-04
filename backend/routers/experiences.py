import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from db.supabase import get_admin_client
from dependencies import get_current_user, get_optional_user
from schemas.experiences import CreateExperienceRequest, ExperienceResponse, LikeResponse
from schemas.trips import ItineraryData, TripResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/experiences", tags=["Experiences"])


def _data(result) -> dict | None:
    """Return result.data when the row exists; None when maybe_single() found nothing."""
    if result is None:
        return None
    return result.data or None


def _row_to_experience(row: dict, current_user_id: str | None) -> ExperienceResponse:
    return ExperienceResponse(
        id=row["id"],
        user_id=row["user_id"],
        author_name=row.get("author_name"),
        trip_id=row.get("trip_id"),
        title=row["title"],
        body=row["body"],
        city=row.get("city"),
        tags=row.get("tags") or [],
        cover_image_url=row.get("cover_image_url"),
        likes_count=row.get("likes_count") or 0,
        is_liked=row.get("is_liked", False) if current_user_id else False,
        created_at=row["created_at"],
    )


async def _attach_author_names(db, rows: list[dict]) -> list[dict]:
    if not rows:
        return rows
    user_ids = list({r["user_id"] for r in rows})
    try:
        result = await db.table("profiles").select("id, full_name").in_("id", user_ids).execute()
        name_map = {p["id"]: p.get("full_name") for p in (result.data or [])}
    except Exception:
        name_map = {}
    for row in rows:
        row["author_name"] = name_map.get(row["user_id"])
    return rows


async def _attach_is_liked(db, rows: list[dict], user_id: str) -> list[dict]:
    if not rows:
        return rows
    exp_ids = [r["id"] for r in rows]
    try:
        result = (
            await db.table("experience_likes")
            .select("experience_id")
            .eq("user_id", user_id)
            .in_("experience_id", exp_ids)
            .execute()
        )
        liked_ids = {r["experience_id"] for r in (result.data or [])}
    except Exception:
        liked_ids = set()
    for row in rows:
        row["is_liked"] = row["id"] in liked_ids
    return rows


@router.get("", response_model=list[ExperienceResponse])
async def list_experiences(
    city: str | None = Query(None),
    tags: str | None = Query(None, description="Comma-separated list of tags"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: dict | None = Depends(get_optional_user),
) -> list[ExperienceResponse]:
    """Return the public experience feed, optionally filtered by city and tags."""
    db = await get_admin_client()
    query = (
        db.table("experiences")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
    )
    if city:
        query = query.ilike("city", f"%{city}%")

    result = await query.execute()
    rows: list[dict] = result.data or []

    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",") if t.strip()]
        if tag_list:
            rows = [
                r for r in rows
                if any(t in [x.lower() for x in (r.get("tags") or [])] for t in tag_list)
            ]

    rows = await _attach_author_names(db, rows)

    user_id = current_user["sub"] if current_user else None
    if user_id:
        rows = await _attach_is_liked(db, rows, user_id)

    return [_row_to_experience(r, user_id) for r in rows]


@router.post("", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(
    req: CreateExperienceRequest,
    current_user: dict = Depends(get_current_user),
) -> ExperienceResponse:
    """Publish a new experience post, optionally linked to one of the author's trips."""
    db = await get_admin_client()

    if req.trip_id:
        trip_check = _data(
            await db.table("trips")
            .select("id")
            .eq("id", req.trip_id)
            .eq("user_id", current_user["sub"])
            .maybe_single()
            .execute()
        )
        if not trip_check:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found or does not belong to you.",
            )

    row = {
        "user_id": current_user["sub"],
        "trip_id": req.trip_id,
        "title": req.title,
        "body": req.body,
        "city": req.city,
        "tags": req.tags,
        "cover_image_url": req.cover_image_url,
    }
    result = await db.table("experiences").insert(row).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save experience.",
        )

    saved = result.data[0]
    profile = _data(
        await db.table("profiles")
        .select("full_name")
        .eq("id", current_user["sub"])
        .maybe_single()
        .execute()
    )
    saved["author_name"] = profile.get("full_name") if profile else None
    saved["is_liked"] = False
    return _row_to_experience(saved, current_user["sub"])


@router.get("/{experience_id}", response_model=ExperienceResponse)
async def get_experience(
    experience_id: str,
    current_user: dict | None = Depends(get_optional_user),
) -> ExperienceResponse:
    """Return a single experience. Public; is_liked resolves when authenticated."""
    db = await get_admin_client()
    row = _data(
        await db.table("experiences")
        .select("*")
        .eq("id", experience_id)
        .maybe_single()
        .execute()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found.")

    profile = _data(
        await db.table("profiles")
        .select("full_name")
        .eq("id", row["user_id"])
        .maybe_single()
        .execute()
    )
    row["author_name"] = profile.get("full_name") if profile else None

    user_id = current_user["sub"] if current_user else None
    row["is_liked"] = False
    if user_id:
        like_row = _data(
            await db.table("experience_likes")
            .select("experience_id")
            .eq("experience_id", experience_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        row["is_liked"] = like_row is not None

    return _row_to_experience(row, user_id)


@router.post("/{experience_id}/like", response_model=LikeResponse)
async def toggle_like(
    experience_id: str,
    current_user: dict = Depends(get_current_user),
) -> LikeResponse:
    """Toggle like on an experience — calling twice undoes the like (idempotent)."""
    db = await get_admin_client()

    exp_row = _data(
        await db.table("experiences")
        .select("id, likes_count")
        .eq("id", experience_id)
        .maybe_single()
        .execute()
    )
    if not exp_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found.")

    current_count: int = exp_row.get("likes_count") or 0
    user_id = current_user["sub"]

    existing = _data(
        await db.table("experience_likes")
        .select("experience_id")
        .eq("experience_id", experience_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if existing is not None:
        await (
            db.table("experience_likes")
            .delete()
            .eq("experience_id", experience_id)
            .eq("user_id", user_id)
            .execute()
        )
        new_count = max(current_count - 1, 0)
        liked = False
    else:
        await (
            db.table("experience_likes")
            .insert({"experience_id": experience_id, "user_id": user_id})
            .execute()
        )
        new_count = current_count + 1
        liked = True

    await db.table("experiences").update({"likes_count": new_count}).eq("id", experience_id).execute()
    return LikeResponse(liked=liked, likes_count=new_count)


@router.post("/{experience_id}/save", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def save_experience(
    experience_id: str,
    current_user: dict = Depends(get_current_user),
) -> TripResponse:
    """Clone the trip linked to an experience into the caller's saved trips."""
    db = await get_admin_client()

    exp_row = _data(
        await db.table("experiences")
        .select("trip_id")
        .eq("id", experience_id)
        .maybe_single()
        .execute()
    )
    if not exp_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found.")

    trip_id: str | None = exp_row.get("trip_id")
    if not trip_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This experience has no linked trip to save.",
        )

    source = _data(
        await db.table("trips")
        .select("*")
        .eq("id", trip_id)
        .maybe_single()
        .execute()
    )
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source trip not found.")
    try:
        itinerary = ItineraryData.model_validate(source["itinerary_data"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Source trip data is corrupted.",
        ) from exc

    clone_row = {
        "user_id": current_user["sub"],
        "origin": source.get("origin"),
        "destination": source.get("destination"),
        "city_name": source.get("city_name"),
        "duration_days": source.get("duration_days"),
        "budget_limit": source.get("budget_limit"),
        "total_budget_est": source.get("total_budget_est"),
        "visa_info": source.get("visa_info"),
        "itinerary_data": itinerary.model_dump(),
        "is_active": True,
        "is_cloned": True,
        "cloned_from": trip_id,
    }

    insert_result = await db.table("trips").insert(clone_row).execute()
    if not insert_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clone trip.",
        )

    saved = insert_result.data[0]
    return TripResponse(
        id=saved["id"],
        destination=saved["destination"] or "",
        origin=saved["origin"] or "",
        duration_days=saved["duration_days"],
        total_budget_est=saved["total_budget_est"],
        itinerary_data=itinerary,
        created_at=saved["created_at"],
    )
