# app/api/endpoints/services.py

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.schemas.user import UserResponse
from app.schemas.business import BusinessBase, BusinessResponse, BusinessUpdate
from app.crud import crud_business, crud_user
from app.core.security import get_current_user
from .users import get_current_admin_user

router = APIRouter()

# --- Dependencia para Dueños ---
async def get_current_owner_user(current_user: UserResponse = Depends(get_current_user)):
    if current_user.role not in ["dueño", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acción solo para dueños o administradores")
    return current_user

# --- Endpoint público para ver todos los negocios publicados ---
@router.get("/", response_model=List[BusinessResponse])
async def get_all_published_businesses(db: AsyncIOMotorDatabase = Depends(get_database)):
    businesses = await crud_business.get_published_businesses(db)
    return [BusinessResponse.model_validate(b) for b in businesses]

# --- Endpoint para Dueños autenticados ---

@router.get("/my-businesses", response_model=List[BusinessResponse])
async def get_my_businesses(
    db: AsyncIOMotorDatabase = Depends(get_database),
    owner: UserResponse = Depends(get_current_owner_user)
):
    """Obtiene la lista de negocios del dueño autenticado."""
    businesses = await crud_business.get_businesses_by_owner_id(db, owner.id)
    return [BusinessResponse.model_validate(b) for b in businesses]

@router.post("/my-business", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def register_new_business(
    business_in: BusinessBase,
    db: AsyncIOMotorDatabase = Depends(get_database),
    owner: UserResponse = Depends(get_current_owner_user)
):
    """Un dueño registra un nuevo negocio para sí mismo."""
    business_dict = business_in.model_dump()
    new_business = await crud_business.create_business(db, business_data=business_dict, owner_id=owner.id)
    return BusinessResponse.model_validate(new_business)

# --- Ruta para actualizar un negocio ---
@router.put("/my-business/{business_id}", response_model=BusinessResponse)
async def update_my_business(
    business_id: str,
    business_in: BusinessUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    owner: UserResponse = Depends(get_current_owner_user)
):
    """Un dueño actualiza uno de sus negocios."""
    business = await crud_business.get_business_by_id(db, business_id)
    if not business or str(business['owner_id']) != owner.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este negocio.")
    updated_business = await crud_business.update_business(db, business_id, owner.id, business_in)
    return BusinessResponse.model_validate(updated_business)

# --- Ruta para publicar/lanzar un negocio ---
@router.post("/my-business/{business_id}/publish", response_model=BusinessResponse)
async def publish_my_business(
    business_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    owner: UserResponse = Depends(get_current_owner_user)
):
    """Un dueño publica uno de sus negocios."""
    business = await crud_business.get_business_by_id(db, business_id)
    if not business or str(business['owner_id']) != owner.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para publicar este negocio.")
    published = await crud_business.publish_business(db, business_id, owner.id)
    if not published:
        raise HTTPException(status_code=404, detail="El negocio no pudo ser publicado.")
    return BusinessResponse.model_validate(published)

# --- Endpoint para ver un negocio específico ---
@router.get("/{business_id}", response_model=BusinessResponse)
async def get_single_business(business_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    business = await crud_business.get_business_by_id(db, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    return BusinessResponse.model_validate(business)

# --- Endpoints solo para Administradores ---
@router.post("/admin/assign-business", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_and_assign_business(
    owner_id: str,
    business_in: BusinessBase,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin: UserResponse = Depends(get_current_admin_user)
):
    """(Admin) Crea un negocio y lo asigna a un dueño existente."""
    owner = await crud_user.get_user_by_id(db, owner_id)
    if not owner or owner['role'] != 'dueño':
        raise HTTPException(status_code=404, detail="El ID proporcionado no corresponde a un usuario con rol 'dueño'.")
    business_dict = business_in.model_dump()
    new_business = await crud_business.create_business(db, business_data=business_dict, owner_id=owner_id)
    return BusinessResponse.model_validate(new_business)