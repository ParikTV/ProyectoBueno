# app/schemas/appointment.py

from pydantic import BaseModel, Field, field_validator # Ensure field_validator is imported
from datetime import datetime # Ensure datetime is imported
from .user import PyObjectId
from bson import ObjectId

class AppointmentBase(BaseModel):
    service_id: str
    appointment_time: datetime
    status: str = "confirmada"

class AppointmentCreate(BaseModel):
    service_id: str
    appointment_time: datetime # Keep this as datetime

    @field_validator('appointment_time', mode='before')
    @classmethod
    def parse_appointment_time(cls, v):
        if isinstance(v, str):
            try:
                # Attempt to parse the string into a datetime object
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError("Invalid datetime format for appointment_time. Expected ISO 8601 string.")
        return v


class AppointmentInDB(AppointmentBase):
    id: PyObjectId = Field(alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AppointmentResponse(AppointmentBase):
    id: str = Field(..., alias="_id")
    user_id: str
    created_at: datetime

    @field_validator("id", mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}