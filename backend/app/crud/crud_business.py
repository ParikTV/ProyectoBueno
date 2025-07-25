# app/crud/crud_business.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any, Optional
from bson import ObjectId
from datetime import datetime, timedelta
import calendar

from app.schemas.business import BusinessCreate, BusinessUpdate, Schedule

# --- ¡FUNCIÓN CORREGIDA! ---
async def get_businesses_by_owner(db: AsyncIOMotorDatabase, owner_id: str) -> List[Dict[str, Any]]:
    """Obtiene todos los negocios que pertenecen a un dueño específico."""
    # CORRECCIÓN: Convertimos el owner_id de string a ObjectId antes de hacer la consulta.
    owner_object_id = ObjectId(owner_id)
    return await db.businesses.find({"owner_id": owner_object_id}).to_list(100)

async def create_business(db: AsyncIOMotorDatabase, business: BusinessCreate, owner_id: str) -> Dict[str, Any]:
    """Crea un nuevo negocio en la base de datos."""
    business_dict = business.model_dump()
    business_dict["owner_id"] = ObjectId(owner_id)
    business_dict["status"] = "draft"
    business_dict["photos"] = []
    business_dict["categories"] = []
    business_dict["schedule"] = None
    
    result = await db.businesses.insert_one(business_dict)
    created_business = await db.businesses.find_one({"_id": result.inserted_id})
    return created_business

async def get_published_businesses(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    """Obtiene todos los negocios con estado 'published'."""
    return await db.businesses.find({"status": "published"}).to_list(1000)

async def get_business(db: AsyncIOMotorDatabase, business_id: str) -> Optional[Dict[str, Any]]:
    """Obtiene un único negocio por su ID."""
    return await db.businesses.find_one({"_id": ObjectId(business_id)})

async def update_business(db: AsyncIOMotorDatabase, business_id: str, business_in: BusinessUpdate) -> Optional[Dict[str, Any]]:
    """Actualiza los detalles de un negocio."""
    update_data = business_in.model_dump(exclude_unset=True)
    
    await db.businesses.update_one(
        {"_id": ObjectId(business_id)},
        {"$set": update_data}
    )
    return await db.businesses.find_one({"_id": ObjectId(business_id)})

async def update_business_status(db: AsyncIOMotorDatabase, business_id: str, status: str) -> Optional[Dict[str, Any]]:
    """Actualiza el estado de un negocio (draft/published)."""
    await db.businesses.update_one(
        {"_id": ObjectId(business_id)},
        {"$set": {"status": status}}
    )
    return await db.businesses.find_one({"_id": ObjectId(business_id)})

async def update_business_schedule(db: AsyncIOMotorDatabase, business_id: str, schedule: Schedule) -> Optional[Dict[str, Any]]:
    """Actualiza el horario de citas de un negocio."""
    await db.businesses.update_one(
        {"_id": ObjectId(business_id)},
        {"$set": {"schedule": schedule.model_dump()}}
    )
    return await db.businesses.find_one({"_id": ObjectId(business_id)})

async def get_available_slots_for_day(db: AsyncIOMotorDatabase, business_id: str, date_str: str) -> List[str]:
    """Calcula los horarios disponibles para un negocio en una fecha específica."""
    business = await get_business(db, business_id)
    if not business or not business.get("schedule"):
        raise ValueError("El negocio no tiene un horario configurado.")

    try:
        request_date = datetime.fromisoformat(date_str)
    except ValueError:
        raise ValueError("Formato de fecha inválido. Usar YYYY-MM-DD.")
        
    day_name = calendar.day_name[request_date.weekday()].lower()
    day_schedule = business["schedule"].get(day_name)

    if not day_schedule or not day_schedule.get("is_active"):
        return []

    start_time = datetime.strptime(day_schedule["open_time"], "%H:%M").time()
    end_time = datetime.strptime(day_schedule["close_time"], "%H:%M").time()
    slot_duration = timedelta(minutes=day_schedule["slot_duration_minutes"])

    start_datetime = request_date.replace(hour=start_time.hour, minute=start_time.minute, second=0, microsecond=0)
    end_datetime = request_date.replace(hour=end_time.hour, minute=end_time.minute, second=0, microsecond=0)

    # Buscar citas existentes para ese día
    appointments_cursor = db.appointments.find({
        "business_id": ObjectId(business_id),
        "appointment_time": {
            "$gte": start_datetime,
            "$lt": end_datetime
        }
    })
    
    booked_slots = {}
    async for app in appointments_cursor:
        slot_time = app["appointment_time"].strftime("%H:%M")
        booked_slots[slot_time] = booked_slots.get(slot_time, 0) + 1

    available_slots = []
    current_time = start_datetime
    capacity_per_slot = day_schedule.get("capacity_per_slot", 1)

    while current_time < end_datetime:
        slot_str = current_time.strftime("%H:%M")
        if booked_slots.get(slot_str, 0) < capacity_per_slot:
            available_slots.append(slot_str)
        current_time += slot_duration

    return available_slots