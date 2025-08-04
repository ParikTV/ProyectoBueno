# backend/app/api/endpoints/appointments.py
from fastapi import APIRouter, Depends, status, HTTPException, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime

from app.db.session import get_database
from app.schemas.user import UserResponse
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.crud import crud_appointment, crud_user, crud_business
from app.core.security import get_current_user
# --- NUEVOS IMPORTS ---
from app.services.notification_service import (
    send_confirmation_email, 
    generate_appointment_pdf_as_bytes, 
    generate_qr_code_as_bytes
)

router = APIRouter()

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_in: AppointmentCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    appointment = await crud_appointment.create(
        db=db,
        business_id=appointment_in.business_id,
        user_id=current_user.id,
        appointment_time=appointment_in.appointment_time
    )
    
    # --- LÓGICA DE NOTIFICACIÓN POST-CITA ---
    business = await crud_business.get_business(db, appointment_in.business_id)
    if current_user.email.endswith('@gmail.com'):
        details = {
            "user_name": current_user.full_name or current_user.email,
            "business_name": business.get("name"),
            "date": appointment_in.appointment_time.strftime("%d/%m/%Y"),
            "time": appointment_in.appointment_time.strftime("%H:%M"),
            "address": business.get("address")
        }
        send_confirmation_email(current_user.email, details)

    return AppointmentResponse.model_validate(appointment)

# --- Endpoint para obtener el PDF de una cita ---
@router.get("/{appointment_id}/pdf")
async def get_appointment_pdf(
    appointment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    appointment = await crud_appointment.get_appointment_by_id(db, appointment_id, current_user.id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada o no te pertenece.")

    business = await crud_business.get_business(db, str(appointment["business_id"]))
    details = {
        "user_name": current_user.full_name or current_user.email,
        "business_name": business.get("name"),
        "date": appointment["appointment_time"].strftime("%d/%m/%Y"),
        "time": appointment["appointment_time"].strftime("%H:%M"),
        "address": business.get("address")
    }

    pdf_bytes = generate_appointment_pdf_as_bytes(details)
    return Response(content=pdf_bytes, media_type='application/pdf', headers={
        'Content-Disposition': f'inline; filename="cita_{appointment_id}.pdf"'
    })

# --- Endpoint para obtener el QR de una cita ---
@router.get("/{appointment_id}/qr")
async def get_appointment_qr(
    appointment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    appointment = await crud_appointment.get_appointment_by_id(db, appointment_id, current_user.id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada o no te pertenece.")
    
    qr_buffer = generate_qr_code_as_bytes(appointment_id)
    return Response(content=qr_buffer.getvalue(), media_type="image/png")

@router.get("/me", response_model=List[AppointmentResponse])
async def get_my_appointments(db: AsyncIOMotorDatabase = Depends(get_database), current_user: UserResponse = Depends(get_current_user)):
    appointments = await crud_appointment.get_appointments_by_user_id(db, user_id=current_user.id)
    return [AppointmentResponse.model_validate(app) for app in appointments]

@router.get("/business/{business_id}", response_model=List[AppointmentResponse])
async def get_business_appointments(business_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    appointments = await crud_appointment.get_appointments_by_business_id(db, business_id=business_id)
    return [AppointmentResponse.model_validate(app) for app in appointments]