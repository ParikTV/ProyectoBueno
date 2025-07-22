# app/crud/crud_appointment.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.appointment import AppointmentCreate
from datetime import datetime
from dateutil import parser

# Función para crear una nueva cita
async def create_appointment(db: AsyncIOMotorDatabase, appointment: AppointmentCreate, user_id: str):
    appointment_data = appointment.model_dump()
    
    # Convertimos el string de la fecha a un objeto datetime antes de guardar
    appointment_data["appointment_time"] = parser.isoparse(appointment.appointment_time)
    
    # Añadimos los datos que genera el servidor
    appointment_data["user_id"] = user_id
    appointment_data["created_at"] = datetime.utcnow()
    appointment_data["status"] = "confirmada"
    
    result = await db["appointments"].insert_one(appointment_data)
    created_appointment = await db["appointments"].find_one({"_id": result.inserted_id})
    return created_appointment

# Función para obtener las citas de un usuario específico
async def get_appointments_by_user(db: AsyncIOMotorDatabase, user_id: str):
    appointments = await db["appointments"].find({"user_id": user_id}).to_list(100)
    return appointments