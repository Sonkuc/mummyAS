from sqlmodel import Session, select, delete
from typing import List
from ..models import TeethRecord, TeethRecordCreate

def get_teeth_for_child(session: Session, child_id: str) -> List[TeethRecord]:
    """Vrátí všechny zuby pro dané dítě."""
    return session.exec(select(TeethRecord).where(TeethRecord.child_id == child_id)).all()

def sync_teeth_for_child(session: Session, child_id: str, new_records: List[TeethRecordCreate]):
    # 1. Hromadné smazání všech zubů dítěte
    statement = delete(TeethRecord).where(TeethRecord.child_id == child_id)
    session.exec(statement)
    
    # 2. Vložení nových záznamů
    synced_records = []
    for data in new_records:
        rec = TeethRecord(**data.dict(), child_id=child_id)
        session.add(rec)
        synced_records.append(rec)
    
    # 3. Jeden commit pro smazání i vložení
    session.commit()
    
    # 4. Refresh pro získání ID a created_at ze serveru
    for r in synced_records:
        session.refresh(r)
        
    return synced_records