from sqlmodel import Session, select
from typing import List, Optional

from ..models import TeethRecord, TeethRecordCreate, TeethRecordUpdate

# ============ TEETH CRUD OPERATIONS ============

def create_teeth_record(
    session: Session,
    child_id: str,
    data: TeethRecordCreate
):
    rec = TeethRecord(
        **data.dict(),
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def get_teeth_record(session: Session, teeth_id: str) -> Optional[TeethRecord]:
    """Return a teeth record by its primary id."""
    return session.get(TeethRecord, teeth_id)

def get_teeth_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[TeethRecord]:
    """Return all teeth records for a given child. Optionally filter by date (YYYY-MM-DD)."""
    query = select(TeethRecord).where(TeethRecord.child_id == child_id)
    if date:
        query = query.where(TeethRecord.date == date)
    return session.exec(query).all()

def get_teeth_by_tooth(session: Session, child_id: str, tooth_id: str) -> Optional[TeethRecord]:
    """
    Return a single TeethRecord for a given child and tooth_id (e.g. "U1", "L2").
    Useful if you want to find whether a specific tooth already has a date recorded.
    """
    return session.exec(
        select(TeethRecord).where(
            TeethRecord.child_id == child_id,
            TeethRecord.tooth_id == tooth_id
        )
    ).first()

def find_teeth_by_date(session: Session, child_id: str, date: str) -> List[TeethRecord]:
    """Find teeth records for a child on an exact date (useful to check duplicates)."""
    return session.exec(
        select(TeethRecord).where(TeethRecord.child_id == child_id, TeethRecord.date == date)
    ).all()

def update_teeth_record(session: Session, teeth_id: str, teeth_data: TeethRecordUpdate) -> Optional[TeethRecord]:
    """Update fields of an existing teeth record (partial update supported)."""
    teeth = session.get(TeethRecord, teeth_id)
    if not teeth:
        return None

    update_dict = teeth_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(teeth, key, value)

    session.add(teeth)
    session.commit()
    session.refresh(teeth)
    return teeth

def delete_teeth_record(session: Session, teeth_id: str) -> bool:
    """Delete a teeth record by id. Returns True if deleted else False."""
    teeth = session.get(TeethRecord, teeth_id)
    if not teeth:
        return False

    session.delete(teeth)
    session.commit()
    return True