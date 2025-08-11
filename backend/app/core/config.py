# backend/app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

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
    MAIL_DEFAULT_SENDER: Optional[str] = None
    MAIL_FROM_NAME: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",   # <--- clave: evita el ValidationError por variables extra
    )

settings = Settings()