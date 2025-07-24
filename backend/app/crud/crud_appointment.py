# app/crud/crud_appointment.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

# La función se llama 'create' y recibe los parámetros directamente
async def create(db: AsyncIOMotorDatabase, *, business_id: str, user_id: str, appointment_time: datetime):
    appointment_doc = {
        "service_id": ObjectId(business_id), # Lo guardamos como 'service_id'
        "user_id": ObjectId(user_id),
        "appointment_time": appointment_time,
        "status": "confirmed",
        "created_at": datetime.utcnow()
    }
    
    result = await db["appointments"].insert_one(appointment_doc)
    created_appointment = await db["appointments"].find_one({"_id": result.inserted_id})
    return created_appointment

async def get_appointments_by_user_id(db: AsyncIOMotorDatabase, user_id: str):
    return await db["appointments"].find({"user_id": ObjectId(user_id)}).to_list(100)

async def get_appointments_by_business_id(db: AsyncIOMotorDatabase, business_id: str):
    return await db["appointments"].find({"service_id": ObjectId(business_id)}).to_list(1000)