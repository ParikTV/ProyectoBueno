# app/schemas/category.py

from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str  # Usaremos str para el ID de MongoDB
    name: str

    class Config:
        from_attributes = True # Reemplaza a orm_mode en Pydantic v2
        populate_by_name = True
        arbitrary_types_allowed = True

class CategoryInDB(CategoryBase):
    id: str