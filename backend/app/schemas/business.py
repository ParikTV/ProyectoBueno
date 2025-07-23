# app/schemas/business.py

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any, List, Literal
from .user import PyObjectId
from bson import ObjectId

class BusinessBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    address: str
    logo_url: Optional[str] = None
    # --- CAMPOS NUEVOS AÑADIDOS ---
    photos: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    status: Literal["draft", "published"] = "draft"

class BusinessCreate(BusinessBase):
    pass # El owner_id se gestiona en el backend

# --- ESQUEMA DE ACTUALIZACIÓN MEJORADO ---
class BusinessUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = None
    logo_url: Optional[str] = None
    photos: Optional[List[str]] = None
    categories: Optional[List[str]] = None

class BusinessInDB(BusinessBase):
    id: PyObjectId = Field(alias="_id")
    owner_id: PyObjectId

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class BusinessResponse(BusinessBase):
    id: str = Field(..., alias="_id")
    owner_id: str

    @field_validator("id", "owner_id", mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        return v
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}