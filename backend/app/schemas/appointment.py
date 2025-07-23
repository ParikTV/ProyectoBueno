# app/schemas/appointment.py

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Any
from .user import PyObjectId
from bson import ObjectId
import dateutil.parser # Importante para parsear fechas de forma robusta

class AppointmentBase(BaseModel):
    service_id: str
    appointment_time: datetime

# --- ESQUEMA DE CREACIÓN CORREGIDO Y FINAL ---
class AppointmentCreate(BaseModel):
    service_id: str
    appointment_time: str # Recibimos la fecha como texto desde el frontend

    @field_validator('appointment_time', mode='before')
    @classmethod
    def parse_appointment_time(cls, value: str) -> datetime:
        """
        Este validador se ejecuta automáticamente y convierte el texto de la fecha
        en un objeto datetime real que el resto del backend puede usar.
        Esta es la solución definitiva al error 422.
        """
        try:
            # Esta función es robusta y entiende el formato ISO que envía el frontend
            return dateutil.parser.isoparse(value)
        except (ValueError, TypeError):
            raise ValueError("El formato de fecha y hora es inválido.")

class AppointmentInDB(AppointmentBase):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    service_id: PyObjectId 

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AppointmentResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    service_id: str
    appointment_time: datetime

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