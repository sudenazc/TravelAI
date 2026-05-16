import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from core.config import get_settings
from db.supabase import get_admin_client
from dependencies import get_current_user
from schemas.trips import (
    GenerateTripRequest,
    ItineraryData,
    TripResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips", tags=["Trips"])

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
LLM_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

SYSTEM_PROMPT = """\
You are a budget-conscious student travel planner. Return ONLY valid JSON — no markdown, no code fences, no extra text.

The JSON must match this exact schema:
{
  "destination": "string",
  "origin": "string",
  "duration_days": number,
  "total_budget_est": number,
  "currency": "USD",
  "visa_info": "string (brief visa requirement for given passport)",
  "accommodation_summary": "string",
  "transport_tips": "string",
  "days": [
    {
      "day": number,
      "title": "string",
      "activities": [
        {
          "time": "HH:MM",
          "name": "string",
          "type": "hotel|food|transport|activity|local_activity",
          "description": "string",
          "cost_est": number,
          "location": "string or null"
        }
      ]
    }
  ]
}

Rules:
- Plan day-by-day with morning, afternoon and evening slots.
- Prioritise student-friendly budget options (hostels, local food, free/cheap attractions).
- Include at least one "local_activity" per trip that connects with local student life.
- total_budget_est must reflect the sum of all cost_est values rounded to nearest dollar.
- visa_info must reflect the real requirement for the given passport country.
"""


def _build_user_prompt(req: GenerateTripRequest) -> str:
    interests = ", ".join(req.interests) if req.interests else "general sightseeing"
    return (
        f"Plan a {req.duration_days}-day student trip from {req.origin} to {req.destination}. "
        f"Passport: {req.passport_country}. "
        f"Budget: ${req.budget_usd} USD total. "
        f"Accommodation preference: {req.accommodation_pref}. "
        f"Transport preference: {req.transport_pref}. "
        f"Interests: {interests}."
    )


async def _call_openrouter(req: GenerateTripRequest) -> ItineraryData:
    settings = get_settings()
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(req)},
        ],
        "temperature": 0.7,
        "max_tokens": 4096,
    }
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://travelai.app",
        "X-Title": "TravelAI",
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)

    if response.status_code != 200:
        logger.error("OpenRouter error %s: %s", response.status_code, response.text)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an error. Please try again.",
        )

    data = response.json()
    message = data["choices"][0]["message"]
    # Some reasoning models return content=null and text in the reasoning field
    raw_content: str | None = message.get("content") or message.get("reasoning")

    if not raw_content:
        logger.error("OpenRouter returned empty content. Full response: %s", data)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an empty response. Please try again.",
        )

    raw_content = raw_content.strip()

    # Strip markdown fences if the model wraps output despite instructions
    if raw_content.startswith("```"):
        lines = raw_content.splitlines()
        raw_content = "\n".join(
            line for line in lines if not line.startswith("```")
        ).strip()

    try:
        itinerary = ItineraryData.model_validate_json(raw_content)
    except Exception as exc:
        logger.error("Failed to parse LLM response: %s\nRaw: %s", exc, raw_content)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned an unexpected response format. Please try again.",
        ) from exc

    return itinerary


@router.post("/generate", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def generate_trip(
    req: GenerateTripRequest,
    current_user: dict = Depends(get_current_user),
) -> TripResponse:
    """Generate an AI itinerary, persist it, and return the saved trip."""
    itinerary = await _call_openrouter(req)

    db = await get_admin_client()
    row = {
        "user_id": current_user["sub"],
        "origin": req.origin,
        "destination": req.destination,
        "city_name": req.destination,
        "duration_days": req.duration_days,
        "budget_limit": req.budget_usd,
        "total_budget_est": itinerary.total_budget_est,
        "visa_info": itinerary.visa_info,
        "itinerary_data": itinerary.model_dump(),
        "is_active": True,
    }

    result = await db.table("trips").insert(row).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save trip.",
        )

    saved = result.data[0]
    return TripResponse(
        id=saved["id"],
        destination=saved["destination"],
        origin=saved["origin"],
        duration_days=saved["duration_days"],
        total_budget_est=saved["total_budget_est"],
        itinerary_data=itinerary,
        created_at=saved["created_at"],
    )


@router.get("", response_model=list[TripResponse])
async def list_trips(
    current_user: dict = Depends(get_current_user),
) -> list[TripResponse]:
    """Return all trips for the authenticated user, newest first."""
    db = await get_admin_client()
    result = (
        await db.table("trips")
        .select("*")
        .eq("user_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
    )

    trips: list[TripResponse] = []
    for row in result.data or []:
        try:
            itinerary = ItineraryData.model_validate(row["itinerary_data"])
        except Exception:
            continue
        trips.append(
            TripResponse(
                id=row["id"],
                destination=row["destination"] or "",
                origin=row["origin"] or "",
                duration_days=row["duration_days"],
                total_budget_est=row["total_budget_est"],
                itinerary_data=itinerary,
                created_at=row["created_at"],
            )
        )
    return trips


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str,
    current_user: dict = Depends(get_current_user),
) -> TripResponse:
    """Return a single trip. RLS ensures only the owner can read it."""
    db = await get_admin_client()
    result = (
        await db.table("trips")
        .select("*")
        .eq("id", trip_id)
        .eq("user_id", current_user["sub"])
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

    row = result.data
    try:
        itinerary = ItineraryData.model_validate(row["itinerary_data"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Trip data is corrupted.",
        ) from exc

    return TripResponse(
        id=row["id"],
        destination=row["destination"] or "",
        origin=row["origin"] or "",
        duration_days=row["duration_days"],
        total_budget_est=row["total_budget_est"],
        itinerary_data=itinerary,
        created_at=row["created_at"],
    )
