# app/api/api.py

from fastapi import APIRouter
from app.api.endpoints import login, users, services, appointments, categories # <-- AÑADE categories

api_router = APIRouter()
api_router.include_router(login.router, prefix="/login", tags=["Login"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(services.router, prefix="/services", tags=["Services"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"]) # <-- AÑADE ESTA LÍNEA