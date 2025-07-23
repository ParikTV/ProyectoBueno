# app/api/endpoints/services.py

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse # Importamos JSONResponse para tener control total
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.crud.crud_business import get_published_businesses

router = APIRouter()

# --- ENDPOINT CORREGIDO CON MÉTODO DEFINITIVO ---
# Eliminamos el 'response_model' para construir la respuesta manualmente
@router.get("/")
async def get_all_public_services(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Obtiene una lista de todos los negocios publicados, asegurando que el formato
    de la respuesta sea el correcto para el frontend.
    """
    businesses_from_db = await get_published_businesses(db)
    
    # --- LA SOLUCIÓN DEFINITIVA ESTÁ AQUÍ ---
    # Creamos una lista de diccionarios manualmente para asegurar que cada campo sea correcto.
    response_data = []
    for business in businesses_from_db:
        # Por cada negocio de la base de datos, creamos un objeto limpio
        response_data.append({
            "id": str(business["_id"]), # Convertimos el _id a string y lo llamamos 'id'
            "owner_id": str(business["owner_id"]), # Convertimos el owner_id a string
            "name": business.get("name", "Nombre no disponible"),
            "description": business.get("description", ""),
            "address": business.get("address", "Ubicación no disponible"),
            "logo_url": business.get("logo_url", ""),
            "photos": business.get("photos", []),
            "categories": business.get("categories", []),
            "status": business.get("status", "draft"),
        })
        
    # Usamos JSONResponse para enviar nuestra lista ya formateada,
    # evitando cualquier error de validación automática.
    return JSONResponse(content=response_data)