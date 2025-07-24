# app/api/endpoints/categories.py

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.schemas.category import CategoryCreate, Category
from app.crud import crud_category
from app.core.security import get_current_user
from .users import get_current_admin_user

router = APIRouter()

@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_new_category(
    category_in: CategoryCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    (Admin) Crea una nueva categoría de servicio.
    """
    existing_category = await crud_category.get_category_by_name(db, category_in.name)
    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una categoría con este nombre.",
        )
    new_category = await crud_category.create_category(db, category_in)
    return Category.model_validate(new_category)


@router.get("/", response_model=List[Category])
async def get_all_categories(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Obtiene una lista de todas las categorías disponibles.
    """
    categories = await crud_category.get_all_categories(db)
    return [Category.model_validate(cat) for cat in categories]