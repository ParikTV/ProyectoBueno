# app/crud/crud_category.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.category import CategoryCreate
from bson import ObjectId

# Obtener todas las categorías
async def get_categories(db: AsyncIOMotorDatabase):
    categories_cursor = db["categories"].find()
    categories = await categories_cursor.to_list(length=100)
    # Convertir ObjectId a string para cada documento
    return [{**cat, "id": str(cat["_id"])} for cat in categories]

# Crear una nueva categoría
async def create_category(db: AsyncIOMotorDatabase, category: CategoryCreate):
    category_data = category.model_dump()
    result = await db["categories"].insert_one(category_data)
    created_category = await db["categories"].find_one({"_id": result.inserted_id})
    if created_category:
        created_category["id"] = str(created_category["_id"])
    return created_category

# Obtener una categoría por nombre (para evitar duplicados)
async def get_category_by_name(db: AsyncIOMotorDatabase, name: str):
    return await db["categories"].find_one({"name": name})