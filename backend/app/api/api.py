# app/api/api.py

from fastapi import APIRouter
from app.api.endpoints import login, users, services, appointments # <-- AÑADIDOS

api_router = APIRouter()
api_router.include_router(login.router, prefix="/login", tags=["Login"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(services.router, prefix="/services", tags=["Services"]) # <-- AÑADIDO
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"]) # <-- AÑADIDO