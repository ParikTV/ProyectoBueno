# app/schemas/business.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict

from .utils import PyObjectId

# --- NUEVOS MODELOS PARA EL HORARIO ---
class ScheduleDay(BaseModel):
    is_active: bool = False
    open_time: str = "09:00"  # Formato HH:MM
    close_time: str = "17:00" # Formato HH:MM
    slot_duration_minutes: int = 30
    capacity_per_slot: int = 1

class Schedule(BaseModel):
    monday: ScheduleDay = Field(default_factory=ScheduleDay)
    tuesday: ScheduleDay = Field(default_factory=ScheduleDay)
    wednesday: ScheduleDay = Field(default_factory=ScheduleDay)
    thursday: ScheduleDay = Field(default_factory=ScheduleDay)
    friday: ScheduleDay = Field(default_factory=ScheduleDay)
    saturday: ScheduleDay = Field(default_factory=ScheduleDay)
    sunday: ScheduleDay = Field(default_factory=ScheduleDay)

# --- MODELOS EXISTENTES (ACTUALIZADOS) ---
class BusinessBase(BaseModel):
    name: str
    description: str
    address: str

class BusinessCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    address: str = Field(..., min_length=5, max_length=150)

class BusinessUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=500)
    address: Optional[str] = Field(None, min_length=5, max_length=150)
    photos: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    schedule: Optional[Schedule] = None # <--- AÑADIDO

class BusinessResponse(BusinessBase):
    id: PyObjectId = Field(alias="_id")
    owner_id: PyObjectId
    photos: List[str]
    categories: List[str]
    status: str
    schedule: Optional[Schedule] = None # <--- AÑADIDO

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {PyObjectId: str}