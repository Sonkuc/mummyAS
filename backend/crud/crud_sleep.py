from sqlmodel import Session, select, delete
from typing import List, Optional
from ..models import SleepRecord, SleepRecordCreate, SleepRecordUpdate

def get_sleep_record(session: Session, sleep_id: str) -> Optional[SleepRecord]:
    """Získá záznam o spánku podle primárního ID."""
    return session.get(SleepRecord, sleep_id)

def get_sleep_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[SleepRecord]:
    """Vrátí všechny záznamy o spánku pro dané dítě, volitelně filtrované datem."""
    query = select(SleepRecord).where(SleepRecord.child_id == child_id)
    if date:
        query = query.where(SleepRecord.date == date)
    return session.exec(query).all()

def sync_sleep_day(session: Session, child_id: str, date: str, sleep_data: List[SleepRecordCreate]) -> List[SleepRecord]:
    session.exec(delete(SleepRecord).where(
        SleepRecord.child_id == child_id,
        SleepRecord.date == date
    ))
    
    new_recs = []
    for item in sorted(sleep_data, key=lambda x: x.time):
        data_dict = item.model_dump()
        data_dict.pop('id', None) # Zajištění, že nevznikne konflikt ID
        new_recs.append(SleepRecord(**data_dict, child_id=child_id, date=date))
    
    session.add_all(new_recs)
    session.commit()
    
    for r in new_recs: 
        session.refresh(r)
    return new_recs

def delete_sleep_record(session: Session, sleep_id: str) -> bool:
    """Smaže záznam o spánku podle ID."""
    sleep = session.get(SleepRecord, sleep_id)
    if not sleep:
        return False

    session.delete(sleep)
    session.commit()
    return True