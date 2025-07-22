# app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    phone_number: str | None = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None

# Este es el modelo público que enviamos como respuesta.
class UserResponse(UserBase):
    # Le decimos a Pydantic que el campo 'id' debe ser llenado
    # con el valor del campo '_id' que viene de la base de datos.
    id: str = Field(..., alias="_id")
    created_at: datetime

    class Config:
        # Habilitamos el uso de alias (como '_id')
        populate_by_name = True
        # Permitimos que Pydantic maneje tipos que no son estándar, como ObjectId
        arbitrary_types_allowed = True
        # Le decimos cómo convertir un ObjectId a un string en la respuesta JSON final
        json_encoders = {
            ObjectId: str
        }# app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field, field_validator
from bson import ObjectId
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    phone_number: str | None = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None

# Este es el modelo público que enviamos como respuesta.
class UserResponse(UserBase):
    # Le decimos a Pydantic que el campo 'id' debe ser llenado
    # con el valor del campo '_id' que viene de la base de datos.
    id: str = Field(..., alias="_id")
    created_at: datetime

    # --- LA SOLUCIÓN ESTÁ AQUÍ ---
    # Este "validador" se ejecuta ANTES de la validación normal.
    # Convierte el ObjectId a un string para que Pydantic esté contento.
    @field_validator("id", mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        # Habilitamos el uso de alias (como '_id')
        populate_by_name = True
        # Permitimos que Pydantic maneje tipos que no son estándar, como ObjectId
        arbitrary_types_allowed = True
        # Le decimos cómo convertir un ObjectId a un string en la respuesta JSON final
        json_encoders = {
            ObjectId: str
        }