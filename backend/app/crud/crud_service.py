# app/crud/crud_service.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.service import ServiceBase # Importamos ServiceBase para crear y actualizar
from bson import ObjectId # Necesario para manejar los IDs de MongoDB

# Función para obtener todos los servicios de la base de datos
async def get_services(db: AsyncIOMotorDatabase):
    services = await db["services"].find().to_list(100)
    return services

# NUEVO: Función para crear un nuevo servicio
async def create_service(db: AsyncIOMotorDatabase, service: ServiceBase):
    service_data = service.model_dump()
    result = await db["services"].insert_one(service_data)
    created_service = await db["services"].find_one({"_id": result.inserted_id})
    return created_service

# NUEVO: Función para actualizar un servicio existente
async def update_service(db: AsyncIOMotorDatabase, service_id: str, service_in: ServiceBase):
    object_id = ObjectId(service_id) # Convertir string a ObjectId
    update_data = service_in.model_dump(exclude_unset=True) # exclude_unset=True permite actualizaciones parciales
    
    if not update_data: # Si no hay datos para actualizar, simplemente devuelve el servicio actual
        return await db["services"].find_one({"_id": object_id})

    await db["services"].update_one({"_id": object_id}, {"$set": update_data})
    return await db["services"].find_one({"_id": object_id})

# NUEVO: Función para eliminar un servicio
async def delete_service(db: AsyncIOMotorDatabase, service_id: str):
    object_id = ObjectId(service_id) # Convertir string a ObjectId
    result = await db["services"].delete_one({"_id": object_id})
    return result # Retorna el resultado de la operación de borrado