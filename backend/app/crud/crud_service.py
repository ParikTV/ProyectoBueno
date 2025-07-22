# app/crud/crud_service.py

from motor.motor_asyncio import AsyncIOMotorDatabase

# Función para obtener todos los servicios de la base de datos
async def get_services(db: AsyncIOMotorDatabase):
    services = await db["services"].find().to_list(100)
    return services

# Función para añadir datos de ejemplo (la usaremos al iniciar el servidor)
async def populate_initial_services(db: AsyncIOMotorDatabase):
    # Verificar si ya existen servicios para no duplicarlos
    count = await db["services"].count_documents({})
    if count == 0:
        print("No se encontraron servicios, añadiendo datos de ejemplo...")
        initial_services = [
            {
                "name": "La Parrilla Argentina",
                "category": "Restaurante",
                "location": "San José, Costa Rica",
                "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto.format&fit=crop"
            },
            {
                "name": "Barbería El Caballero",
                "category": "Barbería",
                "location": "Heredia, Costa Rica",
                "image_url": "https://images.unsplash.com/photo-1536520002442-39764a41e987?q=80&w=2070&auto.format&fit=crop"
            },
            {
                "name": "Hotel Pacífico Azul",
                "category": "Hotel",
                "location": "Puntarenas, Costa Rica",
                "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto.format&fit=crop"
            },
            {
                "name": "Clínica Dental Sonrisa Sana",
                "category": "Clínica",
                "location": "Alajuela, Costa Rica",
                "image_url": "https://images.unsplash.com/photo-1629904850762-e624c0a89add?q=80&w=2070&auto.format&fit=crop"
            }
        ]
        await db["services"].insert_many(initial_services)
        print(f"Se añadieron {len(initial_services)} servicios de ejemplo.")