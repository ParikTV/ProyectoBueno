# app/crud/crud_business.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.business import BusinessUpdate
from bson import ObjectId

async def create_business(db: AsyncIOMotorDatabase, business_data: dict):
    business_data["owner_id"] = ObjectId(business_data["owner_id"])
    business_data["status"] = "draft" 
    result = await db["businesses"].insert_one(business_data)
    return await db["businesses"].find_one({"_id": result.inserted_id})

async def get_business_by_owner_id(db: AsyncIOMotorDatabase, owner_id: str):
    return await db["businesses"].find_one({"owner_id": ObjectId(owner_id)})

# --- FUNCIÓN AÑADIDA QUE SOLUCIONA EL ERROR ---
async def get_business_by_id(db: AsyncIOMotorDatabase, business_id: str):
    """
    Obtiene los detalles de un negocio específico por su ID.
    """
    return await db["businesses"].find_one({"_id": ObjectId(business_id)})

async def update_business(db: AsyncIOMotorDatabase, owner_id: str, business_in: BusinessUpdate):
    update_data = business_in.model_dump(exclude_unset=True)
    if not update_data:
        return await get_business_by_owner_id(db, owner_id)
    
    await db["businesses"].update_one({"owner_id": ObjectId(owner_id)}, {"$set": update_data})
    return await get_business_by_owner_id(db, owner_id)

async def publish_business(db: AsyncIOMotorDatabase, owner_id: str):
    result = await db["businesses"].find_one_and_update(
        {"owner_id": ObjectId(owner_id)},
        {"$set": {"status": "published"}}
    )
    return result

async def get_published_businesses(db: AsyncIOMotorDatabase):
    return await db["businesses"].find({"status": "published"}).to_list(100)