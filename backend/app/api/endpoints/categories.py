# app/api/endpoints/categories.py

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.schemas.category import CategoryCreate, Category
from app.crud import crud_category
from app.core.security import get_current_user
from app.schemas.user import UserResponse

router = APIRouter()

async def get_current_admin_user(current_user: UserResponse = Depends(get_current_user)):
    """Dependencia para verificar que el usuario sea administrador."""
    # Corregimos la verificación para usar 'role' en lugar de 'is_admin'
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user

# --- ENDPOINT CORREGIDO ---
@router.get("/", response_model=List[Category])
async def read_categories(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Recupera todas las categorías.
    """
    categories_from_db = await crud_category.get_categories(db)
    # Validamos cada documento con el modelo Category para asegurar el formato correcto
    return [Category.model_validate(cat) for cat in categories_from_db]

@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_new_category(
    category_in: CategoryCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Crea una nueva categoría. Solo para administradores.
    """
    existing_category = await crud_category.get_category_by_name(db, name=category_in.name)
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"La categoría '{category_in.name}' ya existe."
        )
    
    new_category_data = await crud_category.create_category(db, category=category_in)
    return Category.model_validate(new_category_data)