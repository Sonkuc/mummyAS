from sqlmodel import Session, select, delete
from typing import List, Optional, Tuple
from ..models import Child, SleepRecord, SleepRecordCreate

def get_sleep_record(session: Session, sleep_id: str) -> Optional[SleepRecord]:
    """Získá záznam o spánku podle primárního ID."""
    return session.get(SleepRecord, sleep_id)

def get_sleep_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[SleepRecord]:
    """Vrátí všechny záznamy o spánku pro dané dítě, volitelně filtrované datem."""
    query = select(SleepRecord).where(SleepRecord.child_id == child_id)
    if date:
        query = query.where(SleepRecord.date == date)
    return session.exec(query).all()

def sync_sleep_day(
    session: Session, 
    child_id: str, 
    date: str, 
    sleep_data: List[SleepRecordCreate],
    explicit_mode: Optional[dict] = None,
    has_explicit_mode: bool = False
) -> Tuple[List[SleepRecord], Optional[dict]]:
    """Hromadná synchronizace dne spánku a update globálního časovače."""
    session.exec(delete(SleepRecord).where(
        SleepRecord.child_id == child_id,
        SleepRecord.date == date
    ))
    
    new_recs = []
    sorted_data = sorted(sleep_data, key=lambda x: x.time)
    
    for item in sorted_data:
        data_dict = item.model_dump()
        data_dict.pop('id', None)
        data_dict.pop('date', None)
        new_recs.append(SleepRecord(**data_dict, child_id=child_id, date=date))
    
    session.add_all(new_recs)

    child = session.get(Child, child_id)
    updated_mode = None
    if child:
        if has_explicit_mode:
            child.currentModeSleep = explicit_mode
            updated_mode = explicit_mode
        else:
            # Frontend časovač neposlal (např. dávková synchronizace offline dat) –
            # necháme ho beze změny. Čas začátku posílá vždy frontend v UTC, protože
            # backend nezná časové pásmo uživatele.
            updated_mode = child.currentModeSleep

        session.add(child)
    session.commit()
    
    for r in new_recs: 
        session.refresh(r)
        
    return new_recs, updated_mode

def delete_sleep_record(session: Session, sleep_id: str) -> bool:
    """Smaže záznam o spánku podle ID."""
    sleep = session.get(SleepRecord, sleep_id)
    if not sleep:
        return False

    session.delete(sleep)
    session.commit()
    return True