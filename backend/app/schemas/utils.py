# app/schemas/utils.py

from bson import ObjectId
from typing import Any

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v: Any, _: Any) -> ObjectId:
        if not ObjectId.is_valid(v):
            raise ValueError("ID de ObjectId inválido")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")