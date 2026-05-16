from typing import Literal

from pydantic import BaseModel, Field


class GenerateTripRequest(BaseModel):
    origin: str = Field(..., min_length=1)
    destination: str = Field(..., min_length=1)
    duration_days: int = Field(..., ge=1, le=90)
    accommodation_pref: str
    passport_country: str
    budget_usd: int = Field(..., ge=50)
    transport_pref: str
    interests: list[str] = Field(..., min_length=1)


class ActivityItem(BaseModel):
    time: str
    name: str
    type: Literal["hotel", "food", "transport", "activity", "local_activity"]
    description: str
    cost_est: float = 0.0
    location: str | None = None


class ItineraryDay(BaseModel):
    day: int
    title: str
    activities: list[ActivityItem]


class ItineraryData(BaseModel):
    destination: str
    origin: str
    duration_days: int
    total_budget_est: float
    currency: str = "USD"
    visa_info: str
    accommodation_summary: str
    transport_tips: str
    days: list[ItineraryDay]


class TripResponse(BaseModel):
    id: str
    destination: str
    origin: str
    duration_days: int | None
    total_budget_est: float | None
    itinerary_data: ItineraryData
    created_at: str
