from pydantic import BaseModel, Field


class CreateExperienceRequest(BaseModel):
    trip_id: str | None = None
    title: str = Field(..., min_length=3, max_length=200)
    body: str = Field(..., min_length=10)
    city: str | None = None
    tags: list[str] = Field(default_factory=list)
    cover_image_url: str | None = None


class ExperienceResponse(BaseModel):
    id: str
    user_id: str
    author_name: str | None
    trip_id: str | None
    title: str
    body: str
    city: str | None
    tags: list[str]
    cover_image_url: str | None
    likes_count: int
    is_liked: bool
    created_at: str


class LikeResponse(BaseModel):
    liked: bool
    likes_count: int
