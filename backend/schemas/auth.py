import re

from pydantic import BaseModel, EmailStr, field_validator

_EDU_PATTERN = re.compile(r"^[^@]+@[^@]+\.edu(\.[a-z]{2,})?$", re.IGNORECASE)


def _validate_edu_email(value: str) -> str:
    if not _EDU_PATTERN.match(value):
        raise ValueError("Only .edu or .edu.XX email addresses are accepted")
    return value.lower()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    university_name: str

    @field_validator("email")
    @classmethod
    def must_be_edu(cls, value: str) -> str:
        return _validate_edu_email(value)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
