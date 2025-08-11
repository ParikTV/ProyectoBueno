# app/schemas/review.py
from typing import Any, List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId

class ReviewReply(BaseModel):
    author_role: Literal["owner", "admin"]
    author_id: str
    content: str
    created_at: datetime

    @field_validator("author_id", mode="before")
    @classmethod
    def _oid_to_str(cls, v: Any) -> str:
        return str(v) if isinstance(v, ObjectId) else v

class ReviewCreate(BaseModel):
    business_id: str
    appointment_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = ""

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str = Field(..., alias="_id")
    business_id: str
    user_id: str
    rating: int
    comment: Optional[str] = ""
    created_at: datetime
    updated_at: datetime
    replies: List[ReviewReply] = []

    @field_validator("id", "business_id", "user_id", mode="before")
    @classmethod
    def _oid_to_str(cls, v: Any) -> str:
        return str(v) if isinstance(v, ObjectId) else v

    class Config:
        from_attributes = True
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
