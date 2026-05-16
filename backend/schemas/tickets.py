from typing import Literal

from pydantic import BaseModel, Field


EventCategory = Literal["museum", "networking", "workshop", "local"]
TicketStatus = Literal["upcoming", "used", "expired"]


class EventResponse(BaseModel):
    id: str
    title: str
    category: EventCategory
    image_url: str
    date: str
    time: str
    location: str
    price_usd: float
    spots_left: int | None = None


class PurchaseTicketRequest(BaseModel):
    event_id: str = Field(..., min_length=1)


class OwnedTicketResponse(BaseModel):
    id: str
    event_id: str
    event_title: str
    date: str
    location: str
    status: TicketStatus
    purchased_at: str
