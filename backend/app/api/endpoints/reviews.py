# app/api/endpoints/reviews.py
from __future__ import annotations

from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.db.session import get_database
from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.crud import crud_review, crud_appointment, crud_business

router = APIRouter()


# ------------------------- Helpers -------------------------
def _ensure_updated_at(docs: List[dict]) -> None:
    for r in docs:
        if "updated_at" not in r or r["updated_at"] is None:
            r["updated_at"] = r.get("created_at")


def _as_dt(x) -> Optional[datetime]:
    if isinstance(x, datetime):
        return x
    try:
        return datetime.fromisoformat(str(x))
    except Exception:
        return None


def _normalize_id(x: Any) -> Optional[str]:
    if not x:
        return None
    if isinstance(x, ObjectId):
        return str(x)
    return str(x)


def _stringify_oid(v: Any) -> Any:
    return str(v) if isinstance(v, ObjectId) else v


def _normalize_review_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convierte todos los ObjectId a str para que Pydantic pueda serializar."""
    d = dict(doc)
    for k in ["_id", "id", "user_id", "business_id", "appointment_id"]:
        if k in d:
            d[k] = _stringify_oid(d[k])
    # normaliza reply anidado
    if isinstance(d.get("reply"), dict):
        rp = dict(d["reply"])
        for k in ["author_id", "_id", "id"]:
            if k in rp:
                rp[k] = _stringify_oid(rp[k])
        d["reply"] = rp
    return d


# ------------------------- Endpoints -------------------------
@router.get("/business/{business_id}", response_model=List[ReviewResponse])
async def list_reviews(
    business_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    reviews = await crud_review.get_reviews_by_business(db, business_id)
    _ensure_updated_at(reviews)
    normalized = [_normalize_review_doc(r) for r in reviews]
    return [ReviewResponse.model_validate(r) for r in normalized]


@router.get("/eligibility/{business_id}")
async def can_review(
    business_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Elegible si el usuario tiene **alguna** cita pasada (no cancelada) con el negocio.
    Devuelve la última cita pasada para vincular la reseña.
    """
    now = datetime.utcnow()
    user_apps = await crud_appointment.get_appointments_by_user_id(db, current_user.id)

    # Acepta business_id tanto str como ObjectId
    try:
        bid_oid = ObjectId(business_id)
    except Exception:
        bid_oid = None
    bid_str = business_id

    candidates: List[Dict[str, Any]] = []
    for a in (user_apps or []):
        a_bid = a.get("business_id")
        same_business = str(a_bid) == bid_str or (bid_oid is not None and a_bid == bid_oid)
        status = (a.get("status") or "").lower()
        not_cancelled = status not in ("cancelled", "canceled")
        when = _as_dt(a.get("appointment_time")) or now
        in_past = when <= now
        if same_business and not_cancelled and in_past:
            candidates.append(a)

    if not candidates:
        return {"eligible": False, "appointment_id": None}

    candidates.sort(key=lambda x: _as_dt(x.get("appointment_time")) or datetime.min, reverse=True)
    last = candidates[0]
    last_id = _normalize_id(last.get("_id") or last.get("id"))

    return {"eligible": True, "appointment_id": str(last_id)}


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Crea una reseña. Ahora se permiten múltiples reseñas por negocio:
    se asocian a la **última cita pasada** del usuario con ese negocio.
    """
    appointment_id = payload.appointment_id

    # Si no llega appointment_id, localizamos la última cita pasada elegible
    if not appointment_id:
        now = datetime.utcnow()
        user_apps = await crud_appointment.get_appointments_by_user_id(db, current_user.id)
        try:
            bid_oid = ObjectId(payload.business_id)
        except Exception:
            bid_oid = None
        bid_str = payload.business_id

        candidates: List[Dict[str, Any]] = []
        for a in (user_apps or []):
            a_bid = a.get("business_id")
            same_business = str(a_bid) == bid_str or (bid_oid is not None and a_bid == bid_oid)
            status = (a.get("status") or "").lower()
            not_cancelled = status not in ("cancelled", "canceled")
            when = _as_dt(a.get("appointment_time")) or now
            if same_business and not_cancelled and when <= now:
                candidates.append(a)
        if not candidates:
            raise HTTPException(status_code=400, detail="No pudimos validar una cita elegible para este negocio.")
        candidates.sort(key=lambda x: _as_dt(x.get("appointment_time")) or datetime.min, reverse=True)
        appointment_id = _normalize_id(candidates[0].get("_id"))

    # Validaciones básicas
    appo = await crud_appointment.get_appointment_by_id(db, appointment_id, current_user.id)
    if not appo or str(appo.get("business_id")) != payload.business_id:
        raise HTTPException(status_code=400, detail="Cita inválida para este negocio.")

    when = _as_dt(appo.get("appointment_time"))
    if when is None or when > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Solo puedes reseñar luego de tu cita.")

    # >>> Eliminado el bloqueo "una reseña por cita" <<<

    # Crear reseña
    doc = await crud_review.create_review(
        db,
        business_id=payload.business_id,
        appointment_id=appointment_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment or "",
    )

    # Garantiza timestamps por si tu CRUD no los puso (el nuestro ya los agrega)
    now = datetime.utcnow()
    if doc.get("created_at") is None:
        await db["reviews"].update_one({"_id": doc["_id"]}, {"$set": {"created_at": now}})
        doc["created_at"] = now
    if doc.get("updated_at") is None:
        await db["reviews"].update_one({"_id": doc["_id"]}, {"$set": {"updated_at": doc.get("created_at", now)}})
        doc["updated_at"] = doc.get("created_at", now)

    # Recalcular rating del negocio
    await crud_review.recompute_business_rating(db, payload.business_id)

    normalized = _normalize_review_doc(doc)
    _ensure_updated_at([normalized])
    return ReviewResponse.model_validate(normalized)


@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: str,
    payload: ReviewUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    data: dict = {}
    if payload.rating is not None:
        data["rating"] = payload.rating
    if payload.comment is not None:
        data["comment"] = payload.comment
    if payload.reply is not None:
        data["reply"] = payload.reply.model_dump(exclude_none=True)
    data["updated_at"] = datetime.utcnow()

    updated = await crud_review.update_review(db, review_id, current_user.id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Reseña no encontrada.")

    if updated.get("updated_at") is None:
        now = datetime.utcnow()
        await db["reviews"].update_one({"_id": updated["_id"]}, {"$set": {"updated_at": now}})
        updated["updated_at"] = now

    await crud_review.recompute_business_rating(db, str(updated["business_id"]))
    normalized = _normalize_review_doc(updated)
    _ensure_updated_at([normalized])
    return ReviewResponse.model_validate(normalized)


@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    review = await db["reviews"].find_one({"_id": ObjectId(review_id)})  # type: ignore
    if not review or str(review.get("user_id")) != current_user.id:
        raise HTTPException(status_code=404, detail="Reseña no encontrada.")

    deleted = await crud_review.delete_review(db, review_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="No se pudo eliminar.")

    await crud_review.recompute_business_rating(db, str(review["business_id"]))
    return {"message": "Reseña eliminada."}


@router.post("/{review_id}/reply", response_model=ReviewResponse)
async def reply_review(
    review_id: str,
    payload: dict = Body(...),  # espera {"content": "texto..."}
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
):
    content = (payload or {}).get("content", "")
    if not content or not isinstance(content, str):
        raise HTTPException(status_code=422, detail="Contenido de respuesta inválido.")

    review = await db["reviews"].find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada.")

    business = await crud_business.get_business(db, str(review.get("business_id")))
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
        author_role=("admin" if role == "admin" else "owner"),
        author_id=current_user.id,
        content=content,
    )

    if doc.get("updated_at") is None:
        now = datetime.utcnow()
        await db["reviews"].update_one({"_id": doc["_id"]}, {"$set": {"updated_at": now}})
        doc["updated_at"] = now

    normalized = _normalize_review_doc(doc)
    _ensure_updated_at([normalized])
    return ReviewResponse.model_validate(normalized)
