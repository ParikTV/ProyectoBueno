# --- cargar .env temprano ---
from pathlib import Path
try:
    from dotenv import load_dotenv
    # Carga backend/.env (ajusta la ruta si tu .env está en otra carpeta)
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except Exception:
    # si dotenv no está instalado o falla, seguimos sin .env
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.db.session import connect_to_mongo, close_mongo_connection

app = FastAPI(title="Store Service API")

origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
