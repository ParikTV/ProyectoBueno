# backend/app/crud/crud_appointment.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta

async def create(db: AsyncIOMotorDatabase, *, business_id: str, user_id: str, appointment_time: datetime):
    appointment_doc = {
        "business_id": ObjectId(business_id),
        "user_id": ObjectId(user_id),
        "appointment_time": appointment_time,
        "status": "confirmed",
        "created_at": datetime.utcnow()
    }
    result = await db["appointments"].insert_one(appointment_doc)
    return await db["appointments"].find_one({"_id": result.inserted_id})

async def get_appointment_by_id(db: AsyncIOMotorDatabase, appointment_id: str, user_id: str):
    """Obtiene una cita específica si le pertenece al usuario."""
    if not ObjectId.is_valid(appointment_id): return None
    return await db["appointments"].find_one({
        "_id": ObjectId(appointment_id),
        "user_id": ObjectId(user_id)
    })

async def get_appointments_by_user_id(db: AsyncIOMotorDatabase, user_id: str):
    return await db["appointments"].find({"user_id": ObjectId(user_id)}).to_list(100)

async def get_appointments_by_business_id(db: AsyncIOMotorDatabase, business_id: str):
    return await db["appointments"].find({"business_id": ObjectId(business_id)}).to_list(1000)

async def get_appointments_by_business_id_and_date(db: AsyncIOMotorDatabase, business_id: str, date: datetime):
    start_of_day = datetime(date.year, date.month, date.day)
    end_of_day = start_of_day + timedelta(days=1)
    return await db["appointments"].find({
        "business_id": ObjectId(business_id),
        "appointment_time": {"$gte": start_of_day, "$lt": end_of_day}
    }).to_list(1000)