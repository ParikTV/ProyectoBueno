# app/crud/crud_category.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.category import CategoryCreate

async def get_categories(db: AsyncIOMotorDatabase):
    """
    Obtiene una lista de todas las categorías de la base de datos.
    """
    categories_cursor = db["categories"].find()
    return await categories_cursor.to_list(length=100)

async def get_category_by_name(db: AsyncIOMotorDatabase, name: str):
    """
    Busca una categoría por su nombre.
    """
    return await db["categories"].find_one({"name": name})

async def create_category(db: AsyncIOMotorDatabase, category: CategoryCreate):
    """
    Crea una nueva categoría en la base de datos.
    """
    category_data = category.model_dump()
    result = await db["categories"].insert_one(category_data)
    created_category = await db["categories"].find_one({"_id": result.inserted_id})
    return created_category