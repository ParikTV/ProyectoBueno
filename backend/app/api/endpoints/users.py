# backend/app/api/endpoints/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

# Asegúrate de que todas estas importaciones estén presentes
from app.schemas.user import UserCreate, UserResponse, UserUpdate, OwnerRequest
from app.schemas.category_request import CategoryRequestResponse 
from app.core.security import get_current_user
from app.crud import crud_user
from app.db.session import get_database

router = APIRouter()

async def get_current_admin_user(current_user: UserResponse = Depends(get_current_user)):
    """
    Dependencia que verifica si el usuario autenticado tiene el rol de 'admin'.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Registra un nuevo usuario en la base de datos.
    """
    user = await crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con este correo electrónico."
        )
    new_user = await crud_user.create_user(db, user=user_in)
    return new_user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Obtiene el perfil del usuario autenticado actualmente.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_in: UserUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Actualiza el perfil del usuario autenticado.
    """
    updated_user = await crud_user.update_user(db, user_email=current_user.email, user_in=user_in)
    return updated_user

@router.post("/me/request-owner", response_model=UserResponse)
async def request_owner_status(
    request_data: OwnerRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Permite a un usuario con rol 'usuario' solicitar convertirse en 'dueño'.
    """
    if current_user.role != 'usuario':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los usuarios pueden solicitar ser dueños.")
    
    request_with_status = request_data.model_copy(update={"status": "pending"})
    updated_user = await crud_user.request_to_be_owner(db, current_user.email, request_with_status)
    return updated_user

@router.get("/admin/owner-requests", response_model=List[UserResponse])
async def get_owner_requests(
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user)
):
    """
    (Solo Admin) Obtiene todas las solicitudes pendientes para ser dueño.
    """
    requests_from_db = await crud_user.get_all_owner_requests(db)
    return [UserResponse.model_validate(req) for req in requests_from_db]

@router.post("/admin/approve-owner/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def approve_owner_request_endpoint(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user)
):
    """
    (Solo Admin) Aprueba una solicitud, cambiando el rol del usuario a 'dueño'.
    """
    await crud_user.approve_owner_request(db, user_id)
    return

# --- NUEVO ENDPOINT PARA VER SOLICITUDES DE CATEGORÍA ---
@router.get("/admin/category-requests", response_model=List[CategoryRequestResponse])
async def get_admin_category_requests(
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user)
):
    """
    (Solo Admin) Obtiene todas las solicitudes pendientes para crear nuevas categorías.
    """
    from app.crud.crud_category_request import get_pending_category_requests
    
    requests_from_db = await get_pending_category_requests(db)
    # Validamos los datos para asegurar el formato correcto (_id -> id)
    return [CategoryRequestResponse.model_validate(req) for req in requests_from_db]

# --- NUEVO ENDPOINT PARA APROBAR SOLICITUDES DE CATEGORÍA ---
@router.post("/admin/category-requests/{request_id}/approve", status_code=status.HTTP_204_NO_CONTENT)
async def approve_category_request_endpoint(
    request_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user)
):
    """
    (Solo Admin) Aprueba una solicitud de categoría, creando la nueva categoría.
    """
    from app.crud.crud_category_request import approve_category_request
    
    await approve_category_request(db, request_id)
    return