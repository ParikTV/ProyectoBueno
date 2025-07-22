# app/api/endpoints/services.py

from fastapi import APIRouter, Depends, HTTPException, status # Importar HTTPException y status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.schemas.service import ServiceResponse, ServiceBase # Importar ServiceBase
from app.crud import crud_service
from app.core.security import get_current_user # Importar get_current_user
from app.schemas.user import UserResponse # Importar UserResponse para la dependencia de admin

router = APIRouter()

# NUEVO: Dependencia para verificar si el usuario actual es administrador
async def get_current_admin_user(current_user: UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user

@router.get("/", response_model=List[ServiceResponse])
async def get_all_services(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Obtiene una lista de todos los servicios disponibles.
    """
    services = await crud_service.get_services(db)
    return services

# NUEVO: Endpoint para crear un servicio (solo administradores)
@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_in: ServiceBase, # Esquema para la creación del servicio
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user) # Protegido por la dependencia de admin
):
    """
    Crea un nuevo servicio (solo para administradores).
    """
    service = await crud_service.create_service(db, service_in)
    return service

# NUEVO: Endpoint para actualizar un servicio (solo administradores)
@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    service_in: ServiceBase, # Esquema para la actualización del servicio
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user) # Protegido por la dependencia de admin
):
    """
    Actualiza un servicio existente (solo para administradores).
    """
    updated_service = await crud_service.update_service(db, service_id, service_in)
    if not updated_service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")
    return updated_service

# NUEVO: Endpoint para eliminar un servicio (solo administradores)
@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserResponse = Depends(get_current_admin_user) # Protegido por la dependencia de admin
):
    """
    Elimina un servicio (solo para administradores).
    """
    result = await crud_service.delete_service(db, service_id)
    if not result.deleted_count: # Si no se eliminó nada, el servicio no existía
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")
    return # No devuelve contenido en caso de éxito (HTTP 204 No Content)