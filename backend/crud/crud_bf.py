from sqlmodel import Session, select
from typing import List, Optional

from ..models import (
    BreastfeedingRecord,
    BreastfeedingRecordCreate,
    BreastfeedingRecordUpdate,
)

# ============ BREASTFEEDING CRUD OPERATIONS ============

def create_bf_record(
    session: Session,
    child_id: str,
    data: BreastfeedingRecordCreate
):
    rec = BreastfeedingRecord(
        **data.dict(),
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def get_bf_record(session: Session, bf_id: str) -> Optional[BreastfeedingRecord]:
    """Return a breastfeeding record by its primary id."""
    return session.get(BreastfeedingRecord, bf_id)

def get_bf_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[BreastfeedingRecord]:
    """Return all breastfeeding records for a given child. Optionally filter by date (YYYY-MM-DD)."""
    query = select(BreastfeedingRecord).where(BreastfeedingRecord.child_id == child_id)
    if date:
        query = query.where(BreastfeedingRecord.date == date)
    return session.exec(query).all()

def find_bf_by_date(session: Session, child_id: str, date: str) -> List[BreastfeedingRecord]:
    """Find breastfeeding records for a child on an exact date (useful to check duplicates)."""
    return session.exec(
        select(BreastfeedingRecord).where(BreastfeedingRecord.child_id == child_id, BreastfeedingRecord.date == date)
    ).all()

def update_bf_record(session: Session, bf_id: str, bf_data: BreastfeedingRecordUpdate) -> Optional[BreastfeedingRecord]:
    """Update fields of an existing breastfeeding record (partial update supported)."""
    bf = session.get(BreastfeedingRecord, bf_id)
    if not bf:
        return None

    update_dict = bf_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(bf, key, value)

    session.add(bf)
    session.commit()
    session.refresh(bf)
    return bf

def delete_bf_record(session: Session, bf_id: str) -> bool:
    """Delete a breastfeeding record by id. Returns True if deleted else False."""
    bf = session.get(BreastfeedingRecord, bf_id)
    if not bf:
        return False

    session.delete(bf)
    session.commit()
    return True