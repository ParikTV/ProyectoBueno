# app/schemas/category.py

from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId  # <--- ¡ESTA ES LA LÍNEA QUE FALTABA!
from .utils import PyObjectId

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)

# Este es el modelo que tu endpoint está buscando
class Category(CategoryBase):
    id: PyObjectId = Field(alias="_id")

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {PyObjectId: str}

# Dejamos también CategoryResponse por si es usado en otro lugar del frontend/backend
class CategoryResponse(CategoryBase):
    id: str = Field(..., alias="_id")

    class Config:
        from_attributes = True
        populate_by_name = True
        # Aquí también se necesita ObjectId
        json_encoders = {ObjectId: str}