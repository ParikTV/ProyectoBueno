# app/api/endpoints/login.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import timedelta

from app.crud.crud_user import get_user_by_email
# --- LÍNEA CORREGIDA ---
# Importamos la variable que faltaba
from app.core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.session import get_database

router = APIRouter()

@router.post("/access-token")
async def login_for_access_token(
    db: AsyncIOMotorDatabase = Depends(get_database),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Proporciona un token JWT para un usuario y contraseña válidos.
    """
    user = await get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ahora la variable es reconocida
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email']}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}