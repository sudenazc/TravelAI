import asyncio
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from core.config import get_settings
from db.supabase import get_admin_client
from dependencies import get_current_user
from schemas.trips import (
    ActivityItem,
    GenerateTripRequest,
    ItineraryData,
    TripResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips", tags=["Trips"])

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# OpenRouter's built-in free routing — automatically picks the best available free model.
FREE_MODEL = "openrouter/free"

# Per-request timeout (seconds). Free models can be slow; 55s covers most queues.
MODEL_TIMEOUT = httpx.Timeout(connect=8.0, read=55.0, write=8.0, pool=5.0)

# Hard cap for the entire _call_openrouter coroutine (seconds).
# primary call (55s) + repair call (55s) + overhead = ~115s worst-case.
TOTAL_AI_TIMEOUT = 120.0

# Keep token output small so free models respond faster.
# A 7-day itinerary with full activity descriptions fits well within 2500 tokens.
MAX_TOKENS = 2500

REPAIR_SYSTEM = (
    "You are a JSON repair assistant. "
    "Return ONLY the corrected JSON object. "
    "Do NOT add text, markdown, code fences, or any explanation."
)


def _extract_json_object(text: str) -> str:
    """
    Pull the first complete top-level JSON object out of `text`.
    Handles models that prepend reasoning prose or append trailing text.
    """
    if "```" in text:
        lines = text.splitlines()
        text = "\n".join(l for l in lines if not l.startswith("```")).strip()

    start = text.find("{")
    if start == -1:
        return text

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
- If "Available deals" are listed in the user message, reference at least one of them in the itinerary as an activity with the provider name and discounted price.
"""


async def _fetch_opportunities(destination: str, db) -> list[dict]:
    """Return up to 5 available opportunities matching the destination city."""
    try:
        result = (
            await db.table("opportunities")
            .select("title, category, offer_price, is_free, provider_name, event_date")
            .eq("status", "available")
            .ilike("city", f"%{destination}%")
            .limit(5)
            .execute()
        )
        return result.data or []
    except Exception:
        logger.warning("Could not fetch opportunities for '%s'; skipping.", destination)
        return []


def _build_user_prompt(req: GenerateTripRequest, opportunities: list[dict] | None = None) -> str:
    interests = ", ".join(req.interests) if req.interests else "general sightseeing"
    prompt = (
        f"Plan a {req.duration_days}-day student trip from {req.origin} to {req.destination}. "
        f"Passport: {req.passport_country}. "
        f"Budget: ${req.budget_usd} USD total. "
        f"Accommodation preference: {req.accommodation_pref}. "
        f"Transport preference: {req.transport_pref}. "
        f"Interests: {interests}."
    )

    if opportunities:
        lines: list[str] = []
        for opp in opportunities:
            name = opp.get("title", "Deal")
            provider = opp.get("provider_name") or ""
            category = opp.get("category", "")
            if opp.get("is_free"):
                price_str = "free"
            elif opp.get("offer_price") is not None:
                price_str = f"${opp['offer_price']:.0f}"
            else:
                price_str = "discounted"
            line = f"- {name} ({category}"
            if provider:
                line += f" by {provider}"
            line += f", {price_str})"
            lines.append(line)
        prompt += f"\n\nAvailable deals in {req.destination}:\n" + "\n".join(lines)

    return prompt


async def _repair_call(
    client: httpx.AsyncClient,
    model: str,
    raw_bad: str,
    exc_msg: str,
    headers: dict,
) -> ItineraryData | None:
    """Attempt to fix a malformed JSON response using the same model."""
    repair_msgs = [
        {"role": "system", "content": REPAIR_SYSTEM},
        {
            "role": "user",
            "content": (
                f"Fix this invalid JSON so it matches the itinerary schema.\n"
                f"Error: {exc_msg}\n\n"
                f"Broken JSON:\n{raw_bad}"
            ),
        },
    ]
    payload = {
        "model": model,
        "messages": repair_msgs,
        "temperature": 0.2,
        "max_tokens": MAX_TOKENS,
        "response_format": {"type": "json_object"},
    }
    try:
        resp = await client.post(
            OPENROUTER_API_URL, json=payload, headers=headers, timeout=MODEL_TIMEOUT
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        content = data["choices"][0]["message"].get("content", "")
        if not content or len(content.strip()) < 50:
            return None
        content = _extract_json_object(content.strip())
        return ItineraryData.model_validate_json(content)
    except Exception as exc:
        logger.debug("Repair call failed for %s: %s", model, exc)
        return None


async def _call_openrouter(req: GenerateTripRequest, opportunities: list[dict] | None = None) -> ItineraryData:
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://travelai.app",
        "X-Title": "TravelAI",
    }
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(req, opportunities)},
    ]

    payload = {
        "model": FREE_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": MAX_TOKENS,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                OPENROUTER_API_URL, json=payload, headers=headers, timeout=MODEL_TIMEOUT
            )
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI service timed out. Please try again.",
            )

        if response.status_code != 200:
            logger.error("OpenRouter error %s: %s", response.status_code, response.text)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI service returned {response.status_code}. Please try again.",
            )

        data = response.json()
        message = data["choices"][0]["message"]
        raw_content: str | None = message.get("content") or message.get("reasoning")

        if not raw_content or len(raw_content.strip()) < 50:
            logger.error("openrouter/auto returned empty/truncated content: %s", data)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service returned empty content. Please try again.",
            )

        raw_content = _extract_json_object(raw_content.strip())

        try:
            return ItineraryData.model_validate_json(raw_content)
        except Exception as exc:
            logger.warning("Parse failed (%s). Attempting repair.", exc)
            repaired = await _repair_call(client, FREE_MODEL, raw_content, str(exc), headers)
            if repaired is not None:
                logger.info("Repair succeeded.")
                return repaired
            logger.error("Repair failed. Raw:\n%s", raw_content[:400])
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI returned malformed JSON. Please try again.",
            )


async def _inject_local_helpers(itinerary: ItineraryData, destination: str, db) -> ItineraryData:
    """Query active local helpers for the destination and inject them as local_activity slots."""
    try:
        result = (
            await db.table("profiles")
            .select("id, full_name, helper_bio, helper_availability")
            .eq("is_local_helper", True)
            .ilike("helper_region", f"%{destination}%")
            .limit(2)
            .execute()
        )
        helpers = result.data or []
    except Exception:
        logger.warning("Could not fetch local helpers for '%s'; skipping enrichment.", destination)
        return itinerary

    if not helpers or not itinerary.days:
        return itinerary

    new_slots: list[ActivityItem] = []
    for helper in helpers:
        name = helper.get("full_name") or "Local Student Guide"
        bio = helper.get("helper_bio") or "A verified local student ready to show you around."
        availability = helper.get("helper_availability") or "Contact to arrange"
        helper_id = helper.get("id", "")
        new_slots.append(
            ActivityItem(
                time="18:00",
                name=f"Meet Local Guide — {name}",
                type="local_activity",
                description=f"{bio} | Availability: {availability}",
                cost_est=0.0,
                location=f"helper_id:{helper_id}",
            )
        )

    # Inject slots into Day 1 (first available day)
    first_day = itinerary.days[0]
    updated_activities = first_day.activities + new_slots
    updated_first_day = first_day.model_copy(update={"activities": updated_activities})
    updated_days = [updated_first_day] + list(itinerary.days[1:])
    return itinerary.model_copy(update={"days": updated_days})


@router.post("/generate", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def generate_trip(
    req: GenerateTripRequest,
    current_user: dict = Depends(get_current_user),
) -> TripResponse:
    """Generate an AI itinerary, persist it, and return the saved trip."""
    db = await get_admin_client()

    # Fetch destination-matching opportunities to enrich the LLM prompt.
    opportunities = await _fetch_opportunities(req.destination, db)

    try:
        itinerary = await asyncio.wait_for(
            _call_openrouter(req, opportunities),
            timeout=TOTAL_AI_TIMEOUT,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service took too long to respond. Please try again.",
        )

    # Optionally enrich itinerary with local helpers matching the destination.
    if req.want_local_helper:
        itinerary = await _inject_local_helpers(itinerary, req.destination, db)

    # Ensure a profile row exists — signup doesn't create it automatically.
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
