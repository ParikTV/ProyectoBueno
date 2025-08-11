# app/crud/crud_review.py
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

COLL = "reviews"

async def get_reviews_by_business(db: AsyncIOMotorDatabase, business_id: str) -> List[dict]:
    return await db[COLL].find({"business_id": ObjectId(business_id)}).sort("created_at", -1).to_list(1000)

async def get_user_review_for_appointment(db: AsyncIOMotorDatabase, user_id: str, appointment_id: str) -> Optional[dict]:
    return await db[COLL].find_one({
        "user_id": ObjectId(user_id),
        "appointment_id": ObjectId(appointment_id),
    })

async def create_review(
    db: AsyncIOMotorDatabase,
    *,
    business_id: str,
    appointment_id: str,
    user_id: str,
    rating: int,
    comment: str,
) -> dict:
    now = datetime.utcnow()
    doc = {
        "business_id": ObjectId(business_id),
        "appointment_id": ObjectId(appointment_id),
        "user_id": ObjectId(user_id),
        "rating": rating,
        "comment": comment or "",
        "created_at": now,
        "updated_at": now,
        "replies": [],
    }
    res = await db[COLL].insert_one(doc)
    return await db[COLL].find_one({"_id": res.inserted_id})

async def update_review(db: AsyncIOMotorDatabase, review_id: str, user_id: str, data: dict) -> Optional[dict]:
    data["updated_at"] = datetime.utcnow()
    await db[COLL].update_one(
        {"_id": ObjectId(review_id), "user_id": ObjectId(user_id)},
        {"$set": data}
    )
    return await db[COLL].find_one({"_id": ObjectId(review_id)})

async def delete_review(db: AsyncIOMotorDatabase, review_id: str, user_id: str) -> int:
    res = await db[COLL].delete_one({"_id": ObjectId(review_id), "user_id": ObjectId(user_id)})
    return res.deleted_count

async def add_reply(
    db: AsyncIOMotorDatabase,
    *,
    review_id: str,
    author_role: Literal["owner", "admin"],
    author_id: str,
    content: str,
) -> Optional[dict]:
    reply = {
        "author_role": author_role,
        "author_id": ObjectId(author_id),
        "content": content,
        "created_at": datetime.utcnow(),
    }
    await db[COLL].update_one({"_id": ObjectId(review_id)}, {"$push": {"replies": reply}})
    return await db[COLL].find_one({"_id": ObjectId(review_id)})

async def recompute_business_rating(db: AsyncIOMotorDatabase, business_id: str) -> dict:
    pipeline = [
        {"$match": {"business_id": ObjectId(business_id)}},
        {"$group": {"avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    agg = await db[COLL].aggregate(pipeline).to_list(1)
    avg = float(agg[0]["avg"]) if agg else 0.0
    count = int(agg[0]["count"]) if agg else 0
    await db["businesses"].update_one(
        {"_id": ObjectId(business_id)},
        {"$set": {"rating_avg": avg, "rating_count": count}}
    )
    return {"rating_avg": avg, "rating_count": count}
