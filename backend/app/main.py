from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.db.session import connect_to_mongo, close_mongo_connection

app = FastAPI(title="Store Service API")

# --- ESTA ES LA CONFIGURACIÓN CORRECTA DE CORS ---
# Orígenes permitidos (tu frontend)
origins = [
    "http://localhost",
    "http://localhost:5173", # La dirección de tu frontend con Vite/React
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Esencial para que las cookies/tokens funcionen
    allow_methods=["*"],    # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"],    # Permite todas las cabeceras, incluyendo 'Authorization'
)
# --- FIN DE LA CONFIGURACIÓN DE CORS ---


@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Store Service API"}