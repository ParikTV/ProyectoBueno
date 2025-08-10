# backend/app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api"

    # --- Variables de Base de Datos ---
    DATABASE_URL: str
    DATABASE_NAME: str
    
    # --- ¡LA LÍNEA IMPORTANTE ESTÁ AQUÍ! ---
    # Esta línea debe existir para que Pydantic lea la clave secreta
    SECRET_KEY: str
    
    # --- Otras Variables de Seguridad ---
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GOOGLE_CLIENT_ID: str

    # --- Variables para el Envío de Correos ---
    MAIL_SERVER: str
    MAIL_PORT: int
    MAIL_USERNAME: str
    MAIL_PASSWORD: str

    class Config:
        env_file = ".env"

settings = Settings()