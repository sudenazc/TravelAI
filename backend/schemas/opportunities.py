from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

OpportunityCategory = Literal[
    "Museum", "Concert", "Art", "Hotel", "Workshop", "Festival", "Networking"
]
OpportunityStatus = Literal["available", "claimed", "expired"]


class OpportunityResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    city: str
    category: OpportunityCategory
    provider_name: str | None = None
    original_price: float | None = None
    offer_price: float | None = None
    is_free: bool
    status: OpportunityStatus
    is_last_minute: bool
    expires_at: datetime | None = None
    event_date: datetime | None = None


class ClaimedOpportunityResponse(OpportunityResponse):
    claim_code: str | None = None
