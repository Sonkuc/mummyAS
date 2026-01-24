from sqlmodel import Session, select
from typing import List, Optional

from ..models import FoodRecord, FoodRecordCreate, FoodRecordUpdate

# ============ FOOD CRUD OPERATIONS ============

def save_food_record(session: Session, child_id: str, data: FoodRecordCreate):
    # OPRAVA: Musíme hledat podle food_name, ne label
    statement = select(FoodRecord).where(
        FoodRecord.child_id == child_id, 
        FoodRecord.food_name == data.food_name  # Změněno z .label
    )
    existing_rec = session.exec(statement).first()

    if existing_rec:
        existing_rec.date = data.date
        existing_rec.category = data.category
        session.add(existing_rec)
        session.commit()
        session.refresh(existing_rec)
        return existing_rec
    else:
        rec = FoodRecord(**data.dict(), child_id=child_id)
        session.add(rec)
        session.commit()
        session.refresh(rec)
        return rec
    
def get_food_record(session: Session, food_id: str) -> Optional[FoodRecord]:
    """Return a food record by its primary id."""
    return session.get(FoodRecord, food_id)

def get_food_for_child(session: Session, child_id: str, date: Optional[str] = None, category: Optional[str] = None) -> List[FoodRecord]:
    """Return all food records for a given child. Optionally filter by date and/or category."""
    query = select(FoodRecord).where(FoodRecord.child_id == child_id)
    if date:
        query = query.where(FoodRecord.date == date)
    if category:
        query = query.where(FoodRecord.category == category)
    return session.exec(query).all()

def find_food_by_date(session: Session, child_id: str, date: str) -> List[FoodRecord]:
    """Find food records for a child on an exact date (useful to check duplicates)."""
    return session.exec(
        select(FoodRecord).where(FoodRecord.child_id == child_id, FoodRecord.date == date)
    ).all()

def update_food_record(session: Session, food_id: str, food_data: FoodRecordUpdate) -> Optional[FoodRecord]:
    """Update fields of an existing food record (partial update supported)."""
    food = session.get(FoodRecord, food_id)
    if not food:
        return None

    update_dict = food_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(food, key, value)

    session.add(food)
    session.commit()
    session.refresh(food)
    return food

def delete_food_record(session: Session, food_id: str) -> bool:
    """Delete a food record by id. Returns True if deleted else False."""
    food = session.get(FoodRecord, food_id)
    if not food:
        return False

    session.delete(food)
    session.commit()
    return True