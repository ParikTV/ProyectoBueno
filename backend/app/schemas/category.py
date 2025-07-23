# app/schemas/category.py

from pydantic import BaseModel, Field, field_validator
from typing import Any
from bson import ObjectId
from .user import PyObjectId # Reutilizamos el validador

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

# --- ESQUEMA CORREGIDO ---
class Category(BaseModel):
    id: str = Field(..., alias="_id")
    name: str

    # Validador para convertir el ObjectId de la base de datos a string
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

class CategoryInDB(CategoryBase):
    id: PyObjectId = Field(alias="_id")