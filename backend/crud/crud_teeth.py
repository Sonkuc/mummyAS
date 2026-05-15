from sqlmodel import Session, select, delete
from typing import List
from ..models import TeethRecord, TeethRecordCreate

def get_teeth_for_child(session: Session, child_id: str) -> List[TeethRecord]:
    """Vrátí aktuální seznam všech zubů pro dané dítě."""
    return session.exec(
        select(TeethRecord).where(TeethRecord.child_id == child_id)
    ).all()

def sync_teeth_for_child(session: Session, child_id: str, new_records: List[TeethRecordCreate]) -> List[TeethRecord]:
    """
    Synchronizuje stav zubů dítěte metodou 'Delete & Insert'.
    Vše probíhá v rámci jedné transakce.
    """
    # 1. Hromadné smazání všech stávajících záznamů zubů pro dané dítě
    statement = delete(TeethRecord).where(TeethRecord.child_id == child_id)
    session.exec(statement)
    
    # 2. Vytvoření a příprava nových záznamů
    synced_records = []
    for data in new_records:
        rec = TeethRecord(**data.model_dump(), child_id=child_id)
        session.add(rec)
        synced_records.append(rec)
    
    # 3. Commit transakce (smazání i vložení najednou)
    session.commit()
    
    # 4. Refresh objektů pro získání ID a časových razítek vygenerovaných databází
    for r in synced_records:
        session.refresh(r)
        
    return synced_records