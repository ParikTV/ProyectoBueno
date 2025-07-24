# app/api/api.py

from fastapi import APIRouter
from .endpoints import login, users, services, categories, appointments

api_router = APIRouter()

# Configuración final y correcta de las rutas
api_router.include_router(login.router, prefix="/login", tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])

# AQUÍ ESTÁ LA CLAVE: Usamos el router de 'services.py' pero con el prefijo '/businesses'
api_router.include_router(services.router, prefix="/businesses", tags=["businesses"])

api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])