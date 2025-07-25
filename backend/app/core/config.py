# app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Añadimos la ruta base para la API.
    API_V1_STR: str = "/api"

    # --- Variables que se cargan desde el archivo .env ---
    DATABASE_URL: str
    DATABASE_NAME: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        # Le decimos a Pydantic que lea las variables desde un archivo .env
        env_file = ".env"

# Creamos una instancia de la configuración que se usará en toda la app
settings = Settings()