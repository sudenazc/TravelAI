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

# Ordered free-model fallback list. We pass this as OpenRouter's `models` param so
# OpenRouter itself falls back to the next entry when one errors or is rate-limited
# (429) — all within a single HTTP request.
#
# Order matters and is tuned for the free tier's two failure modes:
#  1. SPEED: lead with a small, fast model. Big free models (e.g. 120B reasoning)
#     can take minutes and blow the per-request timeout.
#  2. PROVIDER SPREAD: the next entries sit on different upstream providers, so a
#     rate-limit on one provider doesn't sink every fallback. `openrouter/free`
#     is last as a catch-all across the rest of the free pool.
#
# Only models advertising `structured_outputs` belong here, since we send a strict
# `json_schema` response format. Verify the current pool with:
#   curl https://openrouter.ai/api/v1/models  (filter pricing==0 + structured_outputs)
FALLBACK_MODELS = [
    "nvidia/nemotron-nano-9b-v2:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "openrouter/free",
]

# Each attempt is one HTTP request that internally walks FALLBACK_MODELS. We retry
# a few times because free models can return empty content or all be rate-limited.
MAX_ATTEMPTS = 3

# Per-request timeout (seconds). Free models can be slow; 55s covers most queues.
MODEL_TIMEOUT = httpx.Timeout(connect=8.0, read=55.0, write=8.0, pool=5.0)

# Hard cap for the entire _call_openrouter coroutine (seconds).
# 3 attempts × 55s each + repair + overhead ≈ 200s worst-case.
TOTAL_AI_TIMEOUT = 200.0

# Reasoning-capable free models count their chain-of-thought against this budget,
# so it must be generous enough that the actual JSON answer still fits. Too small
# (the old 2500) caused empty/truncated responses. Output is free, so be liberal.
MAX_TOKENS = 8000

REPAIR_SYSTEM = (
    "You are a JSON repair assistant. "
    "Return ONLY the corrected JSON object. "
    "Do NOT add text, markdown, code fences, or any explanation."
)

# Strict JSON Schema sent to OpenRouter as `response_format`. Strict mode requires
# every property listed in `required` and `additionalProperties: false` on every
# object. This mirrors `ItineraryData` in schemas/trips.py — keep them in sync.
ACTIVITY_TYPES = ["hotel", "food", "transport", "activity", "local_activity"]

ITINERARY_JSON_SCHEMA = {
    "name": "itinerary",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "destination": {"type": "string"},
            "origin": {"type": "string"},
            "duration_days": {"type": "integer"},
            "total_budget_est": {"type": "number"},
            "currency": {"type": "string"},
            "visa_info": {"type": "string"},
            "accommodation_summary": {"type": "string"},
            "transport_tips": {"type": "string"},
            "days": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "day": {"type": "integer"},
                        "title": {"type": "string"},
                        "activities": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "properties": {
                                    "time": {"type": "string"},
                                    "name": {"type": "string"},
                                    "type": {"type": "string", "enum": ACTIVITY_TYPES},
                                    "description": {"type": "string"},
                                    "cost_est": {"type": "number"},
                                    "location": {"type": ["string", "null"]},
                                },
                                "required": [
                                    "time",
                                    "name",
                                    "type",
                                    "description",
                                    "cost_est",
                                    "location",
                                ],
                            },
                        },
                    },
                    "required": ["day", "title", "activities"],
                },
            },
        },
        "required": [
            "destination",
            "origin",
            "duration_days",
            "total_budget_est",
            "currency",
            "visa_info",
            "accommodation_summary",
            "transport_tips",
            "days",
        ],
    },
}

RESPONSE_FORMAT = {"type": "json_schema", "json_schema": ITINERARY_JSON_SCHEMA}

# Forces the router to only pick free models that support the parameters we send
# (i.e. structured outputs via json_schema). Without this, the router may select
# a reasoning model that ignores the schema and returns prose.
PROVIDER_PREFS = {"require_parameters": True}


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


# Upper bound on a single rate-limit wait (seconds). Free models report values
# around 10–15s; anything larger would risk the overall TOTAL_AI_TIMEOUT budget.
MAX_RETRY_WAIT = 15.0


def _parse_retry_after(response: httpx.Response) -> float:
    """Read the Retry-After hint from a 429 response, clamped to MAX_RETRY_WAIT."""
    header = response.headers.get("Retry-After") or response.headers.get("retry-after")
    if header:
        try:
            return min(float(header), MAX_RETRY_WAIT)
        except ValueError:
            pass
    try:
        meta = response.json().get("error", {}).get("metadata", {})
        secs = meta.get("retry_after_seconds") or meta.get("retry_after_seconds_raw")
        if secs is not None:
            return min(float(secs), MAX_RETRY_WAIT)
    except Exception:
        pass
    return 0.0


def _extract_content(message: dict) -> str | None:
    """
    Return the assistant's JSON content, or None if the model only produced
    reasoning prose. We deliberately never fall back to the `reasoning` field —
    it holds chain-of-thought text ("Okay, let's tackle this..."), not JSON, and
    feeding it to the parser is what produced the original `json_invalid` error.
    """
    content = message.get("content")
    if content and content.strip():
        return content.strip()
    return None


async def _repair_call(
    client: httpx.AsyncClient,
    raw_bad: str,
    exc_msg: str,
    headers: dict,
) -> ItineraryData | None:
    """Attempt to fix a structurally close but invalid JSON response."""
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
        "models": FALLBACK_MODELS,
        "messages": repair_msgs,
        "temperature": 0.2,
        "max_tokens": MAX_TOKENS,
        "response_format": RESPONSE_FORMAT,
        "provider": PROVIDER_PREFS,
    }
    try:
        resp = await client.post(
            OPENROUTER_API_URL, json=payload, headers=headers, timeout=MODEL_TIMEOUT
        )
        if resp.status_code != 200:
            return None
        content = _extract_content(resp.json()["choices"][0]["message"])
        if not content:
            return None
        extracted = _extract_json_object(content)
        if not extracted.startswith("{"):
            return None
        return ItineraryData.model_validate_json(extracted)
    except Exception as exc:
        logger.debug("Repair call failed: %s", exc)
        return None


async def _try_generate(
    client: httpx.AsyncClient,
    messages: list[dict],
    headers: dict,
    attempt: int,
) -> ItineraryData | None:
    """
    Run one generation attempt against the free router and return a parsed
    ItineraryData, or None on any failure so the caller can retry.
    """
    payload = {
        "models": FALLBACK_MODELS,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": MAX_TOKENS,
        "response_format": RESPONSE_FORMAT,
        "provider": PROVIDER_PREFS,
    }
    try:
        response = await client.post(
            OPENROUTER_API_URL, json=payload, headers=headers, timeout=MODEL_TIMEOUT
        )
    except httpx.TimeoutException:
        logger.warning("Attempt %s timed out; retrying.", attempt)
        return None

    if response.status_code != 200:
        logger.warning(
            "Attempt %s returned HTTP %s: %s", attempt, response.status_code, response.text[:200]
        )
        # All free models rate-limited upstream: honour Retry-After before the next
        # attempt instead of burning retries instantly. Capped so we never blow the
        # overall TOTAL_AI_TIMEOUT budget.
        if response.status_code == 429:
            retry_after = _parse_retry_after(response)
            if retry_after > 0:
                logger.info("Rate-limited; waiting %.1fs before retry.", retry_after)
                await asyncio.sleep(retry_after)
        return None

    data = response.json()
    selected_model = data.get("model", "unknown")
    content = _extract_content(data["choices"][0]["message"])

    if not content or len(content) < 50:
        logger.warning("Attempt %s (%s) returned no JSON content; retrying.", attempt, selected_model)
        return None

    extracted = _extract_json_object(content)
    if not extracted.startswith("{"):
        logger.warning(
            "Attempt %s (%s) returned prose instead of JSON (starts with %r); retrying.",
            attempt,
            selected_model,
            extracted[:40],
        )
        return None

    try:
        return ItineraryData.model_validate_json(extracted)
    except Exception as exc:
        logger.warning("Attempt %s (%s) parse failed (%s). Attempting repair.", attempt, selected_model, exc)
        repaired = await _repair_call(client, extracted, str(exc), headers)
        if repaired is not None:
            logger.info("Repair succeeded on attempt %s.", attempt)
            return repaired
        logger.warning("Repair failed on attempt %s; retrying.", attempt)
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

    async with httpx.AsyncClient() as client:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            logger.info("Generating itinerary (attempt %s/%s)", attempt, MAX_ATTEMPTS)
            result = await _try_generate(client, messages, headers, attempt)
            if result is not None:
                logger.info("Itinerary generated successfully on attempt %s.", attempt)
                return result

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="AI failed to return a valid itinerary after several attempts. Please try again.",
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
