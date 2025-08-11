# app/api/endpoints/reviews.py
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_database
from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.crud import crud_review, crud_appointment, crud_business

router = APIRouter()

@router.get("/business/{business_id}", response_model=List[ReviewResponse])
async def list_reviews(business_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    reviews = await crud_review.get_reviews_by_business(db, business_id)
    return [ReviewResponse.model_validate(r) for r in reviews]

@router.get("/eligibility/{business_id}")
async def can_review(
    business_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    # Última cita del usuario con el negocio en el pasado y no cancelada:
    from datetime import datetime
    all_apps = await crud_appointment.get_appointments_by_business_id(db, business_id)
    my_past = [
        a for a in all_apps
        if str(a["user_id"]) == current_user.id
        and a.get("status") != "cancelled"
        and a["appointment_time"] < datetime.utcnow()
    ]
    if not my_past:
        return {"eligible": False}
    # ¿ya reseñó esa cita?
    last = sorted(my_past, key=lambda x: x["appointment_time"], reverse=True)[0]
    already = await crud_review.get_user_review_for_appointment(db, current_user.id, str(last["_id"]))
    return {"eligible": already is None, "appointment_id": str(last["_id"])}

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    # Validar cita: es del usuario, del negocio y ya pasó
    appo = await crud_appointment.get_appointment_by_id(db, payload.appointment_id, current_user.id)
    if not appo or str(appo["business_id"]) != payload.business_id:
        raise HTTPException(status_code=400, detail="Cita inválida para este negocio.")
    from datetime import datetime
    if appo["appointment_time"] > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Solo puedes reseñar luego de tu cita.")

    exists = await crud_review.get_user_review_for_appointment(db, current_user.id, payload.appointment_id)
    if exists:
        raise HTTPException(status_code=409, detail="Ya publicaste una reseña para esa cita.")

    doc = await crud_review.create_review(
        db,
        business_id=payload.business_id,
        appointment_id=payload.appointment_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment or "",
    )
    await crud_review.recompute_business_rating(db, payload.business_id)
    return ReviewResponse.model_validate(doc)

@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: str,
    payload: ReviewUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    data = {}
    if payload.rating is not None: data["rating"] = payload.rating
    if payload.comment is not None: data["comment"] = payload.comment
    updated = await crud_review.update_review(db, review_id, current_user.id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Reseña no encontrada.")
    await crud_review.recompute_business_rating(db, str(updated["business_id"]))
    return ReviewResponse.model_validate(updated)

@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    # Obtener la reseña para conocer el negocio
    review = await db["reviews"].find_one({"_id": ObjectId(review_id)})  # type: ignore
    if not review or str(review["user_id"]) != current_user.id:
        raise HTTPException(status_code=404, detail="Reseña no encontrada.")
    deleted = await crud_review.delete_review(db, review_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="No se pudo eliminar.")
    await crud_review.recompute_business_rating(db, str(review["business_id"]))
    return {"message": "Reseña eliminada."}

from bson import ObjectId
@router.post("/{review_id}/reply", response_model=ReviewResponse)
async def reply_review(
    review_id: str,
    content: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    # Solo owner del negocio o admin
    review = await db["reviews"].find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada.")
    business = await crud_business.get_business(db, str(review["business_id"]))
    role = "user"
    if business and str(business.get("owner_id")) == current_user.id:
        role = "owner"
    if getattr(current_user, "is_superuser", False) or getattr(current_user, "is_admin", False):
        role = "admin"
    if role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="No autorizado para responder.")

    doc = await crud_review.add_reply(
        db,
        review_id=review_id,
        author_role="admin" if role == "admin" else "owner",
        author_id=current_user.id,
        content=content,
    )
    return ReviewResponse.model_validate(doc)
