# app/api/api.py

from fastapi import APIRouter
from .endpoints import login, users, services, categories, appointments
from .endpoints import businesses, category_requests

api_router = APIRouter()

# --- LÍNEA CORREGIDA ---
# Añadimos el prefijo "/login" que faltaba
api_router.include_router(login.router, prefix="/login", tags=["Login"])

# --- El resto de las rutas no cambian ---
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(services.router, prefix="/services", tags=["Services"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(businesses.router, prefix="/businesses", tags=["Businesses"])
api_router.include_router(category_requests.router, prefix="/category-requests", tags=["Category Requests"])