# app/schemas/appointment.py
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Any
from .user import PyObjectId # Asumo que tienes este helper para ObjectId
from bson import ObjectId

class AppointmentCreate(BaseModel):
    # Usaremos business_id para evitar cualquier conflicto con el nombre anterior
    business_id: str
    appointment_time: datetime

class AppointmentResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    service_id: str
    appointment_time: datetime

    # Este validador es necesario para convertir el _id de MongoDB a un string
    @field_validator("id", "user_id", "service_id", mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        return v
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}