# app/schemas/business.py

from pydantic import BaseModel, Field
from typing import List, Optional
from .utils import PyObjectId

# Modelo base sin validaciones estrictas de longitud, para lectura.
class BusinessBase(BaseModel):
    name: str
    description: str
    address: str

# Modelo para CREAR un negocio. Aquí sí aplicamos las reglas.
class BusinessCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    address: str = Field(..., min_length=5, max_length=150)

# Modelo para ACTUALIZAR. Los campos son opcionales.
class BusinessUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=500)
    address: Optional[str] = Field(None, min_length=5, max_length=150)
    photos: Optional[List[str]] = None
    categories: Optional[List[str]] = None

# Modelo de RESPUESTA. Hereda del base para no fallar con datos antiguos.
class BusinessResponse(BusinessBase):
    id: PyObjectId = Field(alias="_id")
    owner_id: PyObjectId
    photos: List[str]
    categories: List[str]
    status: str

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {PyObjectId: str}