# app/api/endpoints/services.py

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.schemas.service import ServiceResponse
from app.crud import crud_service

router = APIRouter()

@router.get("/", response_model=List[ServiceResponse])
async def get_all_services(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Obtiene una lista de todos los servicios disponibles.
    """
    services = await crud_service.get_services(db)
    return services