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

# Tried in order; next is used on 429, 404, or truncated/invalid JSON.
# Verified against openrouter.ai/models as of 2026-05.
# Excludes thinking/reasoning models that wrap JSON in prose.
FREE_MODELS = [
    "deepseek/deepseek-v4-flash:free",        # 1M ctx, very capable, great JSON
    "nvidia/nemotron-3-super-120b-a12b:free", # 1M ctx, 120B model
    "qwen/qwen3-coder:free",                  # 1M ctx, strong structured output
    "meta-llama/llama-3.3-70b-instruct:free", # 131K ctx, reliable
    "nvidia/nemotron-3-nano-30b-a3b:free",    # 256K ctx
    "qwen/qwen-2.5-7b-instruct:free",         # 131K ctx, best-in-class JSON
    "nvidia/nemotron-nano-9b-v2:free",        # 128K ctx
    "meta-llama/llama-3.2-3b-instruct:free",  # smallest fallback
]

def _extract_json_object(text: str) -> str:
    """
    Pull the first complete top-level JSON object out of `text`.
    Handles models that prepend reasoning prose or append trailing text.
    """
    # Strip markdown fences first
    if "```" in text:
        lines = text.splitlines()
        text = "\n".join(l for l in lines if not l.startswith("```")).strip()

    start = text.find("{")
    if start == -1:
        return text  # No JSON found — let caller raise the parse error

    # Walk backward from the end to find the matching closing brace
    depth = 0
    in_string = False
    escape_next = False
    end = start
    for i, ch in enumerate(text[start:], start=start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break

    return text[start : end + 1]


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
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://travelai.app",
        "X-Title": "TravelAI",
    }
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(req)},
    ]

    last_error: str = "All models failed."
    async with httpx.AsyncClient(timeout=90.0) as client:
        for model in FREE_MODELS:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 8192,
                "response_format": {"type": "json_object"},
            }
            response = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)

            if response.status_code in (429, 404):
                logger.warning("Model %s unavailable (%s), trying next.", model, response.status_code)
                last_error = f"{model} returned {response.status_code}."
                continue

            if response.status_code != 200:
                logger.error("OpenRouter error %s (%s): %s", response.status_code, model, response.text)
                last_error = f"Model {model} returned {response.status_code}."
                continue

            data = response.json()
            message = data["choices"][0]["message"]
            raw_content: str | None = message.get("content") or message.get("reasoning")

            if not raw_content or len(raw_content.strip()) < 50:
                logger.error("Model %s returned empty/truncated content: %s", model, data)
                last_error = f"Model {model} returned empty or truncated content."
                continue

            raw_content = _extract_json_object(raw_content.strip())

            try:
                return ItineraryData.model_validate_json(raw_content)
            except Exception as exc:
                logger.error("Failed to parse response from %s: %s\nRaw: %s", model, exc, raw_content)
                last_error = f"Model {model} returned invalid JSON."
                continue

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"AI service unavailable: {last_error} Please try again in a moment.",
    )


@router.post("/generate", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def generate_trip(
    req: GenerateTripRequest,
    current_user: dict = Depends(get_current_user),
) -> TripResponse:
    """Generate an AI itinerary, persist it, and return the saved trip."""
    itinerary = await _call_openrouter(req)

    db = await get_admin_client()

    # Ensure a profile row exists — signup doesn't create it automatically.
    # upsert is idempotent so repeated calls are safe.
    await db.table("profiles").upsert(
        {"id": current_user["sub"], "edu_email": current_user["email"]},
        on_conflict="id",
    ).execute()

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
