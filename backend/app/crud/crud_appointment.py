# app/crud/crud_appointment.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.appointment import AppointmentCreate # Asegúrate que importe el AppointmentCreate actualizado
from bson import ObjectId
from datetime import datetime

async def create_appointment(db: AsyncIOMotorDatabase, appointment: AppointmentCreate, user_id: str):
    # La validación y conversión de la fecha ya ocurrió en el esquema,
    # así que aquí 'appointment.appointment_time' ya es un objeto datetime.
    appointment_data = appointment.model_dump()
    
    appointment_data["user_id"] = ObjectId(user_id)
    appointment_data["service_id"] = ObjectId(appointment.service_id)
    appointment_data["status"] = "confirmed"
    appointment_data["created_at"] = datetime.utcnow()
    
    result = await db["appointments"].insert_one(appointment_data)
    return await db["appointments"].find_one({"_id": result.inserted_id})

async def get_appointments_by_user_id(db: AsyncIOMotorDatabase, user_id: str):
    return await db["appointments"].find({"user_id": ObjectId(user_id)}).to_list(100)

async def get_appointments_by_business_id(db: AsyncIOMotorDatabase, business_id: str):
    return await db["appointments"].find({"service_id": ObjectId(business_id)}).to_list(1000)