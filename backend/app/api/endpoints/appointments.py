# backend/app/api/endpoints/appointments.py
from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.concurrency import run_in_threadpool # <-- ¡NUEVO IMPORT!
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime

from app.db.session import get_database
from app.schemas.user import UserResponse
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.crud import crud_appointment, crud_user, crud_business
from app.core.security import get_current_user
from app.services.notification_service import (
    send_confirmation_email, 
    generate_appointment_pdf_as_bytes, 
    generate_qr_code_as_bytes
)

router = APIRouter()

# --- (El endpoint create_appointment no cambia) ---
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
    return AppointmentResponse.model_validate(appointment)

# --- CORRECCIÓN: Se usa run_in_threadpool para llamar a la función de envío de correo ---
@router.post("/{appointment_id}/send-pdf", status_code=status.HTTP_200_OK)
async def send_appointment_pdf_email(
    appointment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    appointment = await crud_appointment.get_appointment_by_id(db, appointment_id, current_user.id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada o no te pertenece.")

    business = await crud_business.get_business(db, str(appointment["business_id"]))
    details = {
        "id": appointment_id,
        "user_name": current_user.full_name or current_user.email,
        "business_name": business.get("name"),
        "date": appointment["appointment_time"].strftime("%d/%m/%Y"),
        "time": appointment["appointment_time"].strftime("%H:%M"),
        "address": business.get("address")
    }
    
    pdf_bytes = generate_appointment_pdf_as_bytes(details)
    
    # Usamos run_in_threadpool para no bloquear el servidor
    success = await run_in_threadpool(
        send_confirmation_email, 
        user_email=current_user.email, 
        details=details, 
        pdf_bytes=pdf_bytes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="No se pudo enviar el correo.")
        
    return {"message": "Correo enviado con éxito."}

# --- (El resto de los endpoints como /pdf, /qr, /me no cambian) ---
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