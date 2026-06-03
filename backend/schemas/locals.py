from datetime import datetime

from pydantic import BaseModel, field_validator


class LocalHelperUpdate(BaseModel):
    is_local_helper: bool
    helper_region: str | None = None
    helper_bio: str | None = None
    helper_availability: str | None = None

    @field_validator("helper_region")
    @classmethod
    def region_required_when_active(cls, v: str | None, info) -> str | None:
        if info.data.get("is_local_helper") and not v:
            raise ValueError("helper_region is required when is_local_helper is true")
        return v


class LocalHelperProfile(BaseModel):
    id: str
    full_name: str | None = None
    helper_region: str
    helper_bio: str | None = None
    helper_availability: str | None = None


class LocalHelperListResponse(BaseModel):
    data: list[LocalHelperProfile]
    total: int


class BookingRequest(BaseModel):
    trip_id: str | None = None
    message: str | None = None


class BookingResponse(BaseModel):
    id: str
    requester_id: str
    helper_id: str
    trip_id: str | None = None
    message: str | None = None
    status: str
    created_at: datetime


class BookingsListResponse(BaseModel):
    as_requester: list[BookingResponse]
    as_helper: list[BookingResponse]
