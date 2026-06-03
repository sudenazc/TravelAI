from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserProfile(BaseModel):
    id: str
    edu_email: EmailStr
    full_name: str | None = None
    university_name: str | None = None
    points: int = 0
    created_at: datetime
    is_local_helper: bool = False
    helper_region: str | None = None
    helper_bio: str | None = None
    helper_availability: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    university_name: str | None = None


class UserResponse(BaseModel):
    data: UserProfile
    message: str = "Success"
