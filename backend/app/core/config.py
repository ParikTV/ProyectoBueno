# backend/app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api"

    DATABASE_URL: str
    DATABASE_NAME: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- NUEVA LÍNEA ---
    # Añadimos la variable para que Pydantic la cargue desde el archivo .env
    GOOGLE_CLIENT_ID: str

    class Config:
        env_file = ".env"

settings = Settings()