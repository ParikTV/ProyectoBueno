# app/crud/crud_category_request.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from app.schemas.category_request import CategoryRequestCreate

async def create_category_request(db: AsyncIOMotorDatabase, request_in: CategoryRequestCreate, owner_id: str):
    request_data = request_in.model_dump()
    request_data["owner_id"] = ObjectId(owner_id)
    request_data["status"] = "pending"
    request_data["created_at"] = datetime.utcnow()
    
    result = await db["category_requests"].insert_one(request_data)
    return await db["category_requests"].find_one({"_id": result.inserted_id})

async def get_all_pending_category_requests(db: AsyncIOMotorDatabase):
    return await db["category_requests"].find({"status": "pending"}).to_list(100)

async def get_category_request_by_id(db: AsyncIOMotorDatabase, request_id: str):
    if not ObjectId.is_valid(request_id):
        return None
    return await db["category_requests"].find_one({"_id": ObjectId(request_id)})

async def approve_category_request_and_create_category(db: AsyncIOMotorDatabase, request_id: str):
    # 1. Obtener la solicitud
    request = await get_category_request_by_id(db, request_id)
    if not request:
        return None

    # 2. Verificar si la categoría ya existe
    existing_category = await db["categories"].find_one({"name": request["category_name"]})
    if existing_category:
        # La categoría ya existe, solo marcamos la solicitud como aprobada
        await db["category_requests"].update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "approved"}}
        )
        return await db["categories"].find_one({"name": request["category_name"]})

    # 3. Crear la nueva categoría
    new_category = {"name": request["category_name"]}
    await db["categories"].insert_one(new_category)
    
    # 4. Actualizar el estado de la solicitud
    await db["category_requests"].update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "approved"}}
    )
    
    return await db["categories"].find_one({"name": request["category_name"]})