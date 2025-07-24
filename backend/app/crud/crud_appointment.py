# app/crud/crud_appointment.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

async def create(db: AsyncIOMotorDatabase, *, business_id: str, user_id: str, appointment_time: datetime):
    appointment_doc = {
        "business_id": ObjectId(business_id), # <--- CAMBIO AQUÍ
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
    # <--- CAMBIO AQUÍ
    return await db["appointments"].find({"business_id": ObjectId(business_id)}).to_list(1000)