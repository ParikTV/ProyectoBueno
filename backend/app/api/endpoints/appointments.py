# app/api/endpoints/appointments.py

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.schemas.user import UserResponse # Ensure UserResponse is imported
from app.core.security import get_current_user
from app.crud import crud_appointment

router = APIRouter()

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_new_appointment(
    appointment_in: AppointmentCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user) # CHANGE: Type hint from dict to UserResponse
):
    """
    Crea una nueva cita para el usuario autenticado.
    """
    user_id = current_user.id # CHANGE THIS LINE: Access 'id' attribute directly
    appointment = await crud_appointment.create_appointment(db, appointment=appointment_in, user_id=user_id)
    return appointment

@router.get("/me", response_model=List[AppointmentResponse])
async def get_my_appointments(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user) # CHANGE: Type hint from dict to UserResponse
):
    """
    Obtiene todas las citas del usuario autenticado.
    """
    user_id = current_user.id # CHANGE THIS LINE: Access 'id' attribute directly
    appointments = await crud_appointment.get_appointments_by_user(db, user_id=user_id)
    return appointments