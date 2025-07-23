# app/api/endpoints/businesses.py

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.session import get_database
from app.schemas.user import UserResponse
from app.schemas.business import BusinessBase, BusinessResponse, BusinessUpdate
from app.crud.crud_business import (
    create_business, 
    get_business_by_owner_id, 
    update_business,
    publish_business,
    get_published_businesses # Importamos la nueva función
)
from app.core.security import get_current_user

router = APIRouter()

async def get_current_owner_user(current_user: UserResponse = Depends(get_current_user)):
    if current_user.role != "dueño":
        raise HTTPException(status_code=403, detail="Acción solo para dueños")
    return current_user

@router.post("/", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def register_business(
    business_in: BusinessBase, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    owner: UserResponse = Depends(get_current_owner_user)
):
    existing_business = await get_business_by_owner_id(db, owner.id)
    if existing_business:
        raise HTTPException(status_code=400, detail="Ya tienes una empresa registrada.")
    
    business_data_with_owner = business_in.model_dump()
    business_data_with_owner['owner_id'] = owner.id
    
    business = await create_business(db, business_data_with_owner)
    return BusinessResponse.model_validate(business)

@router.get("/my-business", response_model=BusinessResponse)
async def get_my_business(
    db: AsyncIOMotorDatabase = Depends(get_database),
    owner: UserResponse = Depends(get_current_owner_user)
):
    business = await get_business_by_owner_id(db, owner.id)
    if not business:
        raise HTTPException(status_code=404, detail="No se encontró una empresa para este dueño.")
    return BusinessResponse.model_validate(business)

# --- ENDPOINT DE ACTUALIZACIÓN ---
@router.put("/my-business", response_model=BusinessResponse)
async def update_my_business(
    business_in: BusinessUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    owner: UserResponse = Depends(get_current_owner_user)
):
    updated_business = await update_business(db, owner.id, business_in)
    if not updated_business:
        raise HTTPException(status_code=404, detail="No se encontró tu empresa para actualizar.")
    return BusinessResponse.model_validate(updated_business)

# --- NUEVO ENDPOINT PARA LANZAR/PUBLICAR ---
@router.post("/my-business/publish", response_model=BusinessResponse)
async def publish_my_business(
    db: AsyncIOMotorDatabase = Depends(get_database),
    owner: UserResponse = Depends(get_current_owner_user)
):
    # Verificamos que el negocio exista antes de intentar publicarlo
    business = await get_business_by_owner_id(db, owner.id)
    if not business:
        raise HTTPException(status_code=404, detail="No se encontró tu empresa para publicarla.")

    await publish_business(db, owner.id)
    
    # Obtenemos la versión actualizada para devolverla
    updated_business = await get_business_by_owner_id(db, owner.id)
    return BusinessResponse.model_validate(updated_business)