# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.api import api_router
from app.db.session import connect_to_mongo, close_mongo_connection, get_database
from app.crud.crud_service import populate_initial_services # <-- NUEVA IMPORTACIÓN

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Al iniciar
    await connect_to_mongo()
    # Poblar la base de datos con datos iniciales si está vacía
    db = await get_database()
    await populate_initial_services(db)
    yield
    # Al apagar
    await close_mongo_connection()

app = FastAPI(
    title="ServiBook API",
    version="2.1.0", # Subimos de versión
    lifespan=lifespan
)

origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "¡Bienvenido a la API de ServiBook v2.1 con Citas!"}