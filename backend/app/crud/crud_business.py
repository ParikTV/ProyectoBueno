from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta
from app.schemas.business import BusinessCreate, BusinessUpdate, Schedule

async def get_business(db: AsyncIOMotorDatabase, business_id: str):
    if not ObjectId.is_valid(business_id):
        return None
    return await db.businesses.find_one({"_id": ObjectId(business_id)})

async def get_published_businesses(db: AsyncIOMotorDatabase):
    cursor = db.businesses.find({"status": "published"})
    return await cursor.to_list(length=None)

async def create_business(db: AsyncIOMotorDatabase, business_in: BusinessCreate, owner_id: str):
    business_data = business_in.model_dump()
    logo_url = business_data.get("logo_url")
    initial_photos = [logo_url] if logo_url else []
    business_data.update({
        "owner_id": ObjectId(owner_id),
        "status": "draft",
        "photos": initial_photos,
        "categories": [],
        "schedule": Schedule().model_dump(),
        "created_at": datetime.utcnow(),
        # si no existiera, por defecto genérico
        "appointment_mode": business_data.get("appointment_mode", "generico"),
    })
    result = await db.businesses.insert_one(business_data)
    return await db.businesses.find_one({"_id": result.inserted_id})

async def update_business(db: AsyncIOMotorDatabase, business_id: str, business_in: BusinessUpdate):
    update_data = business_in.model_dump(exclude_unset=True)
    if not update_data:
        return await get_business(db, business_id)
    await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$set": update_data})
    return await get_business(db, business_id)

async def get_businesses_by_owner(db: AsyncIOMotorDatabase, owner_id: str):
    cursor = db.businesses.find({"owner_id": ObjectId(owner_id)})
    return await cursor.to_list(length=None)

async def update_business_status(db: AsyncIOMotorDatabase, business_id: str, status: str):
    await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$set": {"status": status}})
    return await get_business(db, business_id)

async def update_business_schedule(db: AsyncIOMotorDatabase, business_id: str, schedule_in: Schedule):
    await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$set": {"schedule": schedule_in.model_dump()}})
    return await get_business(db, business_id)

# -------- DISPONIBILIDAD (acepta employee_id opcional) --------
async def get_available_slots_for_day(
    db: AsyncIOMotorDatabase,
    business_id: str,
    date: str,
    employee_id: Optional[str] = None,
):
    business = await get_business(db, business_id)
    if not business or not business.get("schedule"):
        raise ValueError("El negocio no tiene un horario configurado.")

    try:
        request_date = datetime.strptime(date, "%Y-%m-%d")
        day_of_week = request_date.strftime("%A").lower()
    except ValueError:
        raise ValueError("Formato de fecha inválido. Use YYYY-MM-DD.")

    day_schedule = business["schedule"].get(day_of_week)
    if not day_schedule or not day_schedule.get("is_active"):
        return []

    open_time = datetime.strptime(day_schedule["open_time"], "%H:%M").time()
    close_time = datetime.strptime(day_schedule["close_time"], "%H:%M").time()
    slot_duration = int(day_schedule["slot_duration_minutes"])
    capacity_business = int(day_schedule["capacity_per_slot"])

    # construir slots base del negocio
    from_time = datetime.combine(request_date, open_time)
    to_time = datetime.combine(request_date, close_time)
    all_slots = []
    cur = from_time
    while cur < to_time:
        all_slots.append(cur.strftime("%H:%M"))
        cur += timedelta(minutes=slot_duration)

    capacity = capacity_business

    from app.crud.crud_appointment import get_appointments_by_business_id_and_date
    if employee_id:
        if not ObjectId.is_valid(employee_id):
            return []
        employee = await db.employees.find_one({
            "_id": ObjectId(employee_id),
            "business_id": ObjectId(business_id),
            "active": True,
        })
        if not employee:
            return []

        allowed = (employee.get("allowed_slots") or {}).get(day_of_week, [])
        if not allowed:
            return []

        allowed_set = set(allowed)
        all_slots = [s for s in all_slots if s in allowed_set]

        capacity = 1  # por empleado: 1 a la vez
        appointments = await get_appointments_by_business_id_and_date(
            db, business_id, request_date, employee_id=employee_id
        )
    else:
        appointments = await get_appointments_by_business_id_and_date(
            db, business_id, request_date
        )

    # contar ocupación
    slot_counts = {}
    for app in appointments:
        t = app["appointment_time"].strftime("%H:%M")
        slot_counts[t] = slot_counts.get(t, 0) + 1

    return [s for s in all_slots if slot_counts.get(s, 0) < capacity]
