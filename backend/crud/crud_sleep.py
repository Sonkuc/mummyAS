from sqlmodel import Session, select
from typing import List, Optional

from ..models import SleepRecord, SleepRecordCreate, SleepRecordUpdate

# ============ SLEEP CRUD OPERATIONS ============

def create_sleep_record(
    session: Session,
    child_id: str,
    data: SleepRecordCreate
):
    rec = SleepRecord(
        **data.dict(),
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def get_sleep_record(session: Session, sleep_id: str) -> Optional[SleepRecord]:
    """Return a sleep record by its primary id."""
    return session.get(SleepRecord, sleep_id)

def get_sleep_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[SleepRecord]:
    """Return all sleep records for a given child. Optionally filter by date (YYYY-MM-DD)."""
    query = select(SleepRecord).where(SleepRecord.child_id == child_id)
    if date:
        query = query.where(SleepRecord.date == date)
    return session.exec(query).all()

def find_sleep_by_date(session: Session, child_id: str, date: str) -> List[SleepRecord]:
    """Find sleep records for a child on an exact date (useful to check duplicates)."""
    return session.exec(
        select(SleepRecord).where(SleepRecord.child_id == child_id, SleepRecord.date == date)
    ).all()

def update_sleep_record(session: Session, sleep_id: str, sleep_data: SleepRecordUpdate) -> Optional[SleepRecord]:
    """Update fields of an existing sleep record (partial update supported)."""
    sleep = session.get(SleepRecord, sleep_id)
    if not sleep:
        return None

    update_dict = sleep_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(sleep, key, value)

    session.add(sleep)
    session.commit()
    session.refresh(sleep)
    return sleep

def delete_sleep_record(session: Session, sleep_id: str) -> bool:
    """Delete a sleep record by id. Returns True if deleted else False."""
    sleep = session.get(SleepRecord, sleep_id)
    if not sleep:
        return False

    session.delete(sleep)
    session.commit()
    return True