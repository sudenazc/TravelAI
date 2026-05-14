from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserProfile(BaseModel):
    id: str
    edu_email: EmailStr
    full_name: str | None = None
    university_name: str | None = None
    points: int = 0
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = None
    university_name: str | None = None


class UserResponse(BaseModel):
    data: UserProfile
    message: str = "Success"
