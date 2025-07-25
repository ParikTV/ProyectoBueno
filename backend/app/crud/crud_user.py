# app/crud/crud_user.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserUpdate, OwnerRequestSchema
from app.schemas.business import BusinessCreate
from app.crud import crud_business

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    return await db.users.find_one({"email": email})

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str):
    if not ObjectId.is_valid(user_id):
        return None
    return await db.users.find_one({"_id": ObjectId(user_id)})

async def create_user(db: AsyncIOMotorDatabase, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    user_data = user.model_dump()
    user_data["password"] = hashed_password
    user_data["role"] = "usuario"
    user_data["created_at"] = datetime.utcnow()
    
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
    
# --- ¡CAMBIO AQUÍ! ---
async def approve_owner_request(db: AsyncIOMotorDatabase, user_id: str):
    """
    Aprueba la solicitud, actualiza el rol y crea un negocio en borrador
    usando los datos de la solicitud (incluyendo dirección y logo).
    """
    user = await get_user_by_id(db, user_id)
    if not user or not user.get("owner_request"):
        return None

    request_data = user["owner_request"]
    
    # Extraemos todos los datos nuevos
    business_name = request_data.get("business_name")
    business_description = request_data.get("business_description")
    address = request_data.get("address")
    logo_url = request_data.get("logo_url")

    if not business_name or not address:
        # Si faltan datos clave, no se puede crear el negocio
        return None

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": "dueño", "owner_request.status": "approved"}}
    )

    # Creamos el negocio en borrador con la nueva información
    business_schema = BusinessCreate(
        name=business_name,
        description=business_description or "Descripción pendiente.",
        address=address,
        logo_url=logo_url
    )
    await crud_business.create_business(db, business_in=business_schema, owner_id=user_id)
    
    return await get_user_by_id(db, user_id)

async def get_all_owners(db: AsyncIOMotorDatabase):
    cursor = db.users.find({"role": "dueño"})
    return await cursor.to_list(length=100)

async def get_pending_category_requests(db: AsyncIOMotorDatabase):
    cursor = db.category_requests.find({"status": "pending"})
    return await cursor.to_list(length=100)