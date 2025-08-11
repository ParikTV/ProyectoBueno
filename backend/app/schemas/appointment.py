from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Any, Optional
from bson import ObjectId

# ---- Crear cita ----
class AppointmentCreate(BaseModel):
    business_id: str
    appointment_time: datetime
    employee_id: Optional[str] = None  # opcional si el negocio es "por empleado"

# ---- Respuesta básica de cita ----
class AppointmentResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    business_id: str
    appointment_time: datetime
    status: str = "confirmed"
    employee_id: Optional[str] = None

    @field_validator("id", "user_id", "business_id", "employee_id", mode="before")
    @classmethod
    def _oid_to_str(cls, v: Any) -> Any:
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        from_attributes = True
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---- Subdocumento de usuario liviano ----
class UserLite(BaseModel):
    id: str = Field(..., alias="_id")
    email: Optional[str] = None
    full_name: Optional[str] = None

    @field_validator("id", mode="before")
    @classmethod
    def _oid_to_str_user(cls, v: Any) -> Any:
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        from_attributes = True
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---- Respuesta de cita + usuario ----
class AppointmentWithUserResponse(AppointmentResponse):
    user: Optional[UserLite] = None
