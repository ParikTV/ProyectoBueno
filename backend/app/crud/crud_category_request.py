# app/crud/crud_category_request.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

# --- FUNCIÓN CORREGIDA ---
async def create_category_request(db: AsyncIOMotorDatabase, request_data: dict):
    """
    Crea una nueva solicitud de categoría en la base de datos desde un diccionario.
    """
    # Convierte el owner_id de string a ObjectId de MongoDB
    request_data["owner_id"] = ObjectId(request_data["owner_id"])
    request_data["status"] = "pending"
    request_data["created_at"] = datetime.utcnow()
    
    result = await db["category_requests"].insert_one(request_data)
    created_request = await db["category_requests"].find_one({"_id": result.inserted_id})
    return created_request

async def get_pending_category_requests(db: AsyncIOMotorDatabase):
    """
    Obtiene todas las solicitudes de categoría que están pendientes.
    """
    requests = await db["category_requests"].find({"status": "pending"}).to_list(100)
    return requests

async def approve_category_request(db: AsyncIOMotorDatabase, request_id: str):
    """
    Aprueba una solicitud de categoría y crea la nueva categoría.
    """
    request = await db["category_requests"].find_one_and_update(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "approved"}}
    )
    
    if request:
        existing_category = await db["categories"].find_one({"name": request["category_name"]})
        if not existing_category:
            await db["categories"].insert_one({"name": request["category_name"]})
    
    return request