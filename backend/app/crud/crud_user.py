# app/crud/crud_user.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserUpdate, OwnerRequest
from bson import ObjectId
from datetime import datetime

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    return await db["users"].find_one({"email": email})

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str):
    if not ObjectId.is_valid(user_id):
        return None
    return await db["users"].find_one({"_id": ObjectId(user_id)})

async def create_user(db: AsyncIOMotorDatabase, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    user_data = user.model_dump()
    user_data["password"] = hashed_password
    user_data["role"] = "usuario"  # Rol por defecto
    user_data["created_at"] = datetime.utcnow()
    
    result = await db["users"].insert_one(user_data)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return created_user

async def update_user(db: AsyncIOMotorDatabase, user_id: str, user_in: UserUpdate):
    update_data = user_in.model_dump(exclude_unset=True)
    
    if not update_data:
        return await get_user_by_id(db, user_id)

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    return await get_user_by_id(db, user_id)

async def create_owner_request(db: AsyncIOMotorDatabase, user_id: str, request_data: OwnerRequest):
    request_dict = request_data.model_dump()
    request_dict["status"] = "pending" # Forzar estado inicial
    
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"owner_request": request_dict}}
    )
    return await get_user_by_id(db, user_id)

async def get_pending_owner_requests(db: AsyncIOMotorDatabase):
    return await db["users"].find({"owner_request.status": "pending"}).to_list(100)
    
async def approve_owner_request(db: AsyncIOMotorDatabase, user_id: str):
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "role": "dueño",
                "owner_request.status": "approved"
            }
        }
    )
    return await get_user_by_id(db, user_id)

# --- NUEVA FUNCIÓN ---
async def get_all_owners(db: AsyncIOMotorDatabase):
    """Devuelve una lista de todos los usuarios con el rol 'dueño'."""
    return await db["users"].find({"role": "dueño"}).to_list(100)