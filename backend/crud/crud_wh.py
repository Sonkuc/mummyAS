from sqlmodel import Session, select
from typing import List, Optional

from ..models import WeightHeight, WeightHeightCreate, WeightHeightUpdate

# ============ WEIGHT / HEIGHT CRUD OPERATIONS ============

def create_wh_record(
    session: Session,
    child_id: str,
    data: WeightHeightCreate
):
    rec = WeightHeight(
        **data.dict(),
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def get_wh_record(session: Session, wh_id: str) -> Optional[WeightHeight]:
    """Return a weight/height record by its primary id."""
    return session.get(WeightHeight, wh_id)

def get_wh_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[WeightHeight]:
    """Return all weight/height records for a given child. Optionally filter by date (YYYY-MM-DD)."""
    query = select(WeightHeight).where(WeightHeight.child_id == child_id)
    if date:
        query = query.where(WeightHeight.date == date)
    return session.exec(query).all()

def find_wh_by_date(session: Session, child_id: str, date: str) -> List[WeightHeight]:
    """Find weight/height records for a child on an exact date (useful to check duplicates)."""
    return session.exec(
        select(WeightHeight).where(WeightHeight.child_id == child_id, WeightHeight.date == date)
    ).all()

def update_wh_record(session: Session, wh_id: str, wh_data: WeightHeightUpdate) -> Optional[WeightHeight]:
    """Update fields of an existing weight/height record (partial update supported)."""
    wh = session.get(WeightHeight, wh_id)
    if not wh:
        return None

    update_dict = wh_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(wh, key, value)

    session.add(wh)
    session.commit()
    session.refresh(wh)
    return wh

def delete_wh_record(session: Session, wh_id: str) -> bool:
    """Delete a weight/height record by id. Returns True if deleted else False."""
    wh = session.get(WeightHeight, wh_id)
    if not wh:
        return False

    session.delete(wh)
    session.commit()
    return True