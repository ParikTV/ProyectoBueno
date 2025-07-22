# app/api/api.py

from fastapi import APIRouter
# Importamos el objeto 'router' de cada archivo de endpoint
from app.api.endpoints.login import router as login_router
from app.api.endpoints.users import router as users_router

api_router = APIRouter()

# Usamos los routers importados
api_router.include_router(login_router, prefix="/login", tags=["Login"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])