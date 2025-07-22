# app/crud/crud_user.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.user import UserCreate, UserUpdate
# Importamos desde nuestro nuevo archivo de hashing
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
        "created_at": datetime.utcnow()
    }
    result = await db["users"].insert_one(user_db_data)
    return await db["users"].find_one({"_id": result.inserted_id})

async def update_user(db: AsyncIOMotorDatabase, user_email: str, user_in: UserUpdate):
    update_data = user_in.model_dump(exclude_unset=True)
    if not update_data:
        return await get_user_by_email(db, email=user_email)
        
    await db["users"].update_one({"email": user_email}, {"$set": update_data})
    return await get_user_by_email(db, email=user_email)