# app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Any, Literal
from bson import ObjectId
from datetime import datetime

# --- LÍNEA INCORRECTA ELIMINADA ---
# Se eliminó la línea que causaba la importación circular.

# Validador personalizado para los ObjectId de MongoDB
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v: Any, validation_info: Any) -> ObjectId:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema: Any) -> dict:
        field_schema.update(type="string")
        return field_schema

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    phone_number: str | None = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None

class OwnerRequest(BaseModel):
    business_name: str
    business_description: str
    status: Literal["pending", "approved", "rejected"] = "pending"

class UserInDB(UserBase):
    id: PyObjectId = Field(alias="_id")
    hashed_password: str
    created_at: datetime
    role: Literal["usuario", "dueño", "admin"] = "usuario"
    owner_request: OwnerRequest | None = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
    full_name: str | None = None
    phone_number: str | None = None
    created_at: datetime
    role: Literal["usuario", "dueño", "admin"]
    owner_request: OwnerRequest | None = None

    @field_validator("id", mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}