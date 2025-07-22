# app/schemas/appointment.py

from pydantic import BaseModel, Field
from datetime import datetime
from .user import PyObjectId
from bson import ObjectId

# Modelo base que usa el tipo de dato correcto (datetime) para uso interno y respuestas
class AppointmentBase(BaseModel):
    service_id: str
    appointment_time: datetime
    status: str = "confirmada"

# --- LA SOLUCIÓN ESTÁ AQUÍ ---
# Este modelo es para la CREACIÓN de la cita.
# Es simple y define 'appointment_time' como un string para aceptar los datos del frontend.
class AppointmentCreate(BaseModel):
    service_id: str
    appointment_time: str

# Modelo para los datos que están en la base de datos
class AppointmentInDB(AppointmentBase):
    id: PyObjectId = Field(alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Modelo para las respuestas de la API
class AppointmentResponse(AppointmentBase):
    id: str = Field(..., alias="_id")
    user_id: str
    created_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}