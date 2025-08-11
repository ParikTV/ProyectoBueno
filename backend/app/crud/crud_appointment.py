from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta

# ---------- Crear ----------
async def create(
    db: AsyncIOMotorDatabase,
    *,
    business_id: str,
    user_id: str,
    appointment_time: datetime,
    employee_id: Optional[str] = None,
):
    doc: Dict[str, Any] = {
        "business_id": ObjectId(business_id),
        "user_id": ObjectId(user_id),
        "appointment_time": appointment_time,
        "status": "confirmed",
        "created_at": datetime.utcnow(),
    }
    if employee_id:
        doc["employee_id"] = ObjectId(employee_id)

    res = await db["appointments"].insert_one(doc)
    return await db["appointments"].find_one({"_id": res.inserted_id})

# ---------- Lecturas ----------
async def get_appointment_by_id(db: AsyncIOMotorDatabase, appointment_id: str, user_id: str):
    if not ObjectId.is_valid(appointment_id):
        return None
    return await db["appointments"].find_one({"_id": ObjectId(appointment_id), "user_id": ObjectId(user_id)})

async def get_appointments_by_user_id(db: AsyncIOMotorDatabase, user_id: str):
    return await db["appointments"].find({"user_id": ObjectId(user_id)}).to_list(200)

async def get_appointments_by_business_id(db: AsyncIOMotorDatabase, business_id: str):
    return await db["appointments"].find({"business_id": ObjectId(business_id)}).to_list(1000)

async def get_appointments_by_business_id_and_date(
    db: AsyncIOMotorDatabase,
    business_id: str,
    date: datetime,
    employee_id: Optional[str] = None,
):
    start_of_day = datetime(date.year, date.month, date.day)
    end_of_day = start_of_day + timedelta(days=1)
    query: Dict[str, Any] = {
        "business_id": ObjectId(business_id),
        "appointment_time": {"$gte": start_of_day, "$lt": end_of_day},
    }
    if employee_id:
        query["employee_id"] = ObjectId(employee_id)
    return await db["appointments"].find(query).to_list(1000)

# ---------- Con usuario ----------
async def get_business_appointments_with_users(db: AsyncIOMotorDatabase, business_id: str) -> List[Dict[str, Any]]:
    if not ObjectId.is_valid(business_id):
        return []

    appts = await db["appointments"].find(
        {"business_id": ObjectId(business_id)}
    ).sort("appointment_time", 1).to_list(1000)

    user_ids = list({a["user_id"] for a in appts if "user_id" in a})
    users_map: Dict[ObjectId, Dict[str, Any]] = {}

    if user_ids:
        cursor = db["users"].find({"_id": {"$in": user_ids}}, {"full_name": 1, "email": 1})
        async for u in cursor:
            users_map[u["_id"]] = u

    for a in appts:
        u = users_map.get(a.get("user_id"))
        a["user"] = u if u else None

    return appts

# ---------- Actualizar estado ----------
async def update_status(
    db: AsyncIOMotorDatabase,
    appointment_id: str,
    user_id: Optional[str],
    status: str,
):
    if not ObjectId.is_valid(appointment_id):
        return None
    query: Dict[str, Any] = {"_id": ObjectId(appointment_id)}
    if user_id:
        query["user_id"] = ObjectId(user_id)
    await db["appointments"].update_one(query, {"$set": {"status": status, "updated_at": datetime.utcnow()}})
    return await db["appointments"].find_one({"_id": ObjectId(appointment_id)})
