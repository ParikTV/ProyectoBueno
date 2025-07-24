from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.business import BusinessUpdate, Schedule
from bson import ObjectId

async def create_business(db: AsyncIOMotorDatabase, business_data: dict, owner_id: str):
    """Crea un nuevo negocio y lo asocia a un dueño."""
    business_data_copy = business_data.copy()
    business_data_copy["owner_id"] = ObjectId(owner_id)
    business_data_copy.setdefault("photos", [])
    business_data_copy.setdefault("categories", [])
    business_data_copy["status"] = "draft"
    
    result = await db["businesses"].insert_one(business_data_copy)
    return await db["businesses"].find_one({"_id": result.inserted_id})

async def get_businesses_by_owner_id(db: AsyncIOMotorDatabase, owner_id: str):
    """Obtiene todos los negocios de un dueño específico."""
    cursor = db["businesses"].find({"owner_id": ObjectId(owner_id)})
    return await cursor.to_list(length=100)

async def get_business_by_id(db: AsyncIOMotorDatabase, business_id: str):
    """Obtiene los detalles de un negocio específico por su ID."""
    if not ObjectId.is_valid(business_id):
        return None
    return await db["businesses"].find_one({"_id": ObjectId(business_id)})

async def get_published_businesses(db: AsyncIOMotorDatabase):
    """Obtiene todos los negocios publicados."""
    cursor = db["businesses"].find({"status": "published"})
    return await cursor.to_list(length=None)

async def update_business(db: AsyncIOMotorDatabase, business_id: str, owner_id: str, business_in: BusinessUpdate):
    """Actualiza un negocio si pertenece al dueño correcto."""
    update_data = business_in.model_dump(exclude_unset=True)
    if not update_data:
        return await db["businesses"].find_one({"_id": ObjectId(business_id), "owner_id": ObjectId(owner_id)})
    
    await db["businesses"].update_one(
        {"_id": ObjectId(business_id), "owner_id": ObjectId(owner_id)},
        {"$set": update_data}
    )
    return await db["businesses"].find_one({"_id": ObjectId(business_id)})

async def publish_business(db: AsyncIOMotorDatabase, business_id: str, owner_id: str):
    """Publica un negocio si pertenece al dueño."""
    result = await db["businesses"].find_one_and_update(
        {"_id": ObjectId(business_id), "owner_id": ObjectId(owner_id)},
        {"$set": {"status": "published"}},
        return_document=True
    )
    return result

async def update_business_schedule(db: AsyncIOMotorDatabase, business_id: str, schedule_in: Schedule):
    """Actualiza solo el horario de un negocio."""
    schedule_data = schedule_in.model_dump()
    await db["businesses"].update_one(
        {"_id": ObjectId(business_id)},
        {"$set": {"schedule": schedule_data}}
    )
    return await db["businesses"].find_one({"_id": ObjectId(business_id)})