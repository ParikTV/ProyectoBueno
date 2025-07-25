# app/api/endpoints/categories.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.session import get_database
from app.crud import crud_category
from app.schemas.category import CategoryCreate, Category
from app.schemas.user import UserResponse
from app.core.security import get_current_admin_user

router = APIRouter()

# [ADMIN] Crear una nueva categoría
@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    existing_category = await crud_category.get_category_by_name(db, name=category_in.name)
    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una categoría con este nombre."
        )
    # --- ¡CORRECCIÓN! ---
    # Cambiamos 'category_in=' por 'category=' para que coincida con la función.
    category = await crud_category.create_category(db, category=category_in)
    return Category.model_validate(category)

# [PÚBLICO] Obtener todas las categorías
@router.get("/", response_model=List[Category])
async def get_all_categories(db: AsyncIOMotorDatabase = Depends(get_database)):
    categories = await crud_category.get_all_categories(db)
    return [Category.model_validate(cat) for cat in categories]