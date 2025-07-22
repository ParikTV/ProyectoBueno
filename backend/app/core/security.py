# app/core/security.py

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

# Importamos desde nuestro nuevo archivo de hashing
from app.core.hashing import verify_password
from app.db.session import get_database
from app.schemas.token import TokenData
from app.crud.crud_user import get_user_by_email
from app.schemas.user import UserResponse # IMPORTAR UserResponse

SECRET_KEY = "tu-clave-secreta-super-dificil"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login/access-token")

def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    db: AsyncIOMotorDatabase = Depends(get_database), 
    token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user_data = await get_user_by_email(db, email=token_data.email)
    if user_data is None:
        raise credentials_exception
    
    # CONVERTIMOS EL DICCIONARIO A UN OBJETO UserResponse
    # Esto asegura que `current_user` tenga los atributos definidos en el esquema.
    try:
        user = UserResponse(**user_data)
    except Exception as e:
        # Manejo de error si el documento no coincide con el esquema UserResponse
        print(f"Error al parsear UserResponse: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al cargar el perfil del usuario."
        )
    
    return user