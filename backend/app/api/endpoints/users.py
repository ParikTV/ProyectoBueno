# app/api/endpoints/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.schemas.user import UserCreate, UserResponse, UserUpdate, OwnerRequest
from app.schemas.category_request import CategoryRequestCreate, CategoryRequestResponse
from app.schemas.category import CategoryResponse
from app.crud import crud_user, crud_category_request
from app.core.security import get_current_user

router = APIRouter()

# --- Dependencia para verificar si el usuario es Admin ---
def get_current_admin_user(current_user: UserResponse = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return current_user

# --- Endpoints de Usuarios ---
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await crud_user.get_user_by_email(db, user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este correo electrónico.")
    new_user = await crud_user.create_user(db, user_in)
    return UserResponse.model_validate(new_user)

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Obtiene el perfil del usuario actualmente autenticado.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_in: UserUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Actualiza el perfil del usuario (nombre completo, teléfono).
    """
    updated_user = await crud_user.update_user(db, user_id=current_user.id, user_in=user_in)
    return UserResponse.model_validate(updated_user)

@router.post("/me/request-owner", response_model=UserResponse)
async def request_owner_status(
    request_data: OwnerRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Permite a un usuario solicitar el rol de dueño.
    """
    if current_user.role != 'usuario':
        raise HTTPException(status_code=400, detail="Solo los usuarios pueden solicitar ser dueños.")
    if current_user.owner_request and current_user.owner_request.status == 'pending':
        raise HTTPException(status_code=400, detail="Ya tienes una solicitud pendiente.")
        
    updated_user = await crud_user.create_owner_request(db, user_id=current_user.id, request_data=request_data)
    return UserResponse.model_validate(updated_user)


# --- Endpoints de Administración (dentro de /users) ---

@router.get("/admin/owner-requests", response_model=List[UserResponse])
async def get_pending_requests(db: AsyncIOMotorDatabase = Depends(get_database), admin_user: UserResponse = Depends(get_current_admin_user)):
    """
    (Admin) Obtiene todas las solicitudes pendientes para ser dueño.
    """
    requests = await crud_user.get_pending_owner_requests(db)
    return [UserResponse.model_validate(req) for req in requests]

@router.post("/admin/approve-owner/{user_id}", response_model=UserResponse)
async def approve_owner(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database), admin_user: UserResponse = Depends(get_current_admin_user)):
    """
    (Admin) Aprueba una solicitud de dueño y actualiza el rol del usuario.
    """
    user_to_approve = await crud_user.get_user_by_id(db, user_id)
    if not user_to_approve:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    approved_user = await crud_user.approve_owner_request(db, user_id)
    return UserResponse.model_validate(approved_user)

@router.get("/admin/owners", response_model=List[UserResponse])
async def get_all_owner_users(db: AsyncIOMotorDatabase = Depends(get_database), admin_user: UserResponse = Depends(get_current_admin_user)):
    """
    (Admin) Obtiene una lista de todos los usuarios con rol 'dueño'.
    """
    owners = await crud_user.get_all_owners(db)
    return [UserResponse.model_validate(owner) for owner in owners]

# --- Endpoints para Solicitudes de Categorías (dentro de /users) ---

@router.get("/admin/category-requests", response_model=List[CategoryRequestResponse])
async def get_all_category_requests(db: AsyncIOMotorDatabase = Depends(get_database), admin_user: UserResponse = Depends(get_current_admin_user)):
    """
    (Admin) Obtiene todas las solicitudes pendientes para crear categorías.
    """
    requests = await crud_category_request.get_all_pending_category_requests(db)
    return [CategoryRequestResponse.model_validate(req) for req in requests]

@router.post("/admin/category-requests/{request_id}/approve", response_model=CategoryResponse)
async def approve_category_request(
    request_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user)
):
    """
    (Admin) Aprueba una solicitud y crea la nueva categoría.
    """
    new_category = await crud_category_request.approve_category_request_and_create_category(db, request_id)
    if not new_category:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada o error al crear la categoría.")
    return CategoryResponse.model_validate(new_category)