# app/crud/crud_user.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.user import UserCreate, UserUpdate, OwnerRequest
from app.core.hashing import get_password_hash
from datetime import datetime

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    return await db["users"].find_one({"email": email})

async def create_user(db: AsyncIOMotorDatabase, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    user_db_data = {
        "email": user.email,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "role": "usuario",  # ROL POR DEFECTO
        "owner_request": None # Sin solicitud al crear
    }
    result = await db["users"].insert_one(user_db_data)
    return await db["users"].find_one({"_id": result.inserted_id})

async def update_user(db: AsyncIOMotorDatabase, user_email: str, user_in: UserUpdate):
    update_data = user_in.model_dump(exclude_unset=True)
    if not update_data:
        return await get_user_by_email(db, email=user_email)
        
    await db["users"].update_one({"email": user_email}, {"$set": update_data})
    return await get_user_by_email(db, email=user_email)

# NUEVO: Función para solicitar ser dueño
async def request_to_be_owner(db: AsyncIOMotorDatabase, user_email: str, request_data: OwnerRequest):
    await db["users"].update_one(
        {"email": user_email},
        {"$set": {"owner_request": request_data.model_dump()}}
    )
    return await get_user_by_email(db, email=user_email)

# NUEVO: Obtener todas las solicitudes de dueño
async def get_all_owner_requests(db: AsyncIOMotorDatabase):
    return await db["users"].find({"owner_request.status": "pending"}).to_list(100)

# NUEVO: Aprobar una solicitud de dueño
async def approve_owner_request(db: AsyncIOMotorDatabase, user_id: str):
    from bson import ObjectId
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": "dueño", "owner_request.status": "approved"}}
    )