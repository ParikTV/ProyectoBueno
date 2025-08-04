# backend/app/crud/crud_user.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import Dict, Any

from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserUpdate, OwnerRequestSchema
from app.schemas.business import BusinessCreate
from app.crud import crud_business

# URL de una imagen de avatar por defecto
DEFAULT_AVATAR_URL = "https://i.imgur.com/6b6psnA.png"

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    return await db.users.find_one({"email": email})

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str):
    if not ObjectId.is_valid(user_id):
        return None
    return await db.users.find_one({"_id": ObjectId(user_id)})

async def create_user(db: AsyncIOMotorDatabase, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    user_data = user.model_dump()
    user_data["hashed_password"] = hashed_password
    del user_data["password"] 
    
    user_data["role"] = "usuario"
    user_data["created_at"] = datetime.utcnow()
    user_data["profile_picture_url"] = DEFAULT_AVATAR_URL # <-- FOTO POR DEFECTO
    
    result = await db.users.insert_one(user_data)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    return created_user

async def update_user(db: AsyncIOMotorDatabase, user_id: str, user_in: UserUpdate):
    update_data = user_in.model_dump(exclude_unset=True)
    if not update_data:
        return await get_user_by_id(db, user_id)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    return await get_user_by_id(db, user_id)

async def create_owner_request(db: AsyncIOMotorDatabase, user_id: str, request_data: OwnerRequestSchema):
    request_dict = request_data.model_dump()
    request_dict["status"] = "pending"
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"owner_request": request_dict}})
    return await get_user_by_id(db, user_id)

async def get_pending_owner_requests(db: AsyncIOMotorDatabase):
    cursor = db.users.find({"owner_request.status": "pending"})
    return await cursor.to_list(length=100)
    
async def approve_owner_request(db: AsyncIOMotorDatabase, user_id: str):
    # ... (esta función no cambia)
    user = await get_user_by_id(db, user_id)
    if not user or not user.get("owner_request"):
        return None
    request_data = user["owner_request"]
    business_name = request_data.get("business_name")
    address = request_data.get("address")
    if not business_name or not address:
        return None
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": "dueño", "owner_request.status": "approved"}}
    )
    business_schema = BusinessCreate(
        name=business_name,
        description=request_data.get("business_description") or "Descripción pendiente.",
        address=address,
        logo_url=request_data.get("logo_url")
    )
    await crud_business.create_business(db, business_in=business_schema, owner_id=user_id)
    return await get_user_by_id(db, user_id)

async def reject_owner_request(db: AsyncIOMotorDatabase, user_id: str):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"owner_request.status": "rejected"}}
    )
    return await get_user_by_id(db, user_id)

async def get_all_owners(db: AsyncIOMotorDatabase):
    cursor = db.users.find({"role": "dueño"})
    return await cursor.to_list(length=100)

async def get_pending_category_requests(db: AsyncIOMotorDatabase):
    cursor = db.category_requests.find({"status": "pending"})
    return await cursor.to_list(length=100)

async def get_or_create_social_user(db: AsyncIOMotorDatabase, user_info: dict):
    user = await db.users.find_one({"email": user_info["email"]})
    if user:
        # Si el usuario ya existe pero no tiene foto, la actualizamos
        if not user.get("profile_picture_url"):
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"profile_picture_url": user_info.get("picture", DEFAULT_AVATAR_URL)}}
            )
            # Recargamos los datos del usuario para devolver la versión actualizada
            user = await db.users.find_one({"email": user_info["email"]})
        return user

    # Si el usuario no existe, lo creamos con la foto
    new_user_data = {
        "email": user_info["email"],
        "full_name": user_info.get("name"),
        "profile_picture_url": user_info.get("picture", DEFAULT_AVATAR_URL), # <-- GUARDA LA FOTO DE GOOGLE
        "role": "usuario",
        "created_at": datetime.utcnow(),
        "hashed_password": "",
    }
    result = await db.users.insert_one(new_user_data)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    return created_user