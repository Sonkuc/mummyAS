from sqlmodel import Session, select, delete
from typing import List, Optional
from ..models import (
    BreastfeedingRecord,
    BreastfeedingRecordCreate,
    BreastfeedingRecordUpdate,
)

def create_bf_record(session: Session, child_id: str, data: BreastfeedingRecordCreate) -> BreastfeedingRecord:
    """Vytvoří jeden záznam o kojení pro konkrétní dítě."""
    rec = BreastfeedingRecord(
        **data.model_dump(),
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def get_bf_record(session: Session, bf_id: str) -> Optional[BreastfeedingRecord]:
    """Získá záznam o kojení podle primárního ID."""
    return session.get(BreastfeedingRecord, bf_id)

def get_bf_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[BreastfeedingRecord]:
    """Vrátí všechny záznamy o kojení pro dané dítě, volitelně filtrované datem."""
    query = select(BreastfeedingRecord).where(BreastfeedingRecord.child_id == child_id)
    if date:
        query = query.where(BreastfeedingRecord.date == date)
    return session.exec(query).all()

def sync_bf_day(session: Session, child_id: str, date: str, bf_data: List[BreastfeedingRecordCreate]) -> List[BreastfeedingRecord]:
    """Hromadná synchronizace dne kojení (Analogicky ke Sleep)."""
    # 1. Smazání původních záznamů pro daný den
    session.exec(delete(BreastfeedingRecord).where(
        BreastfeedingRecord.child_id == child_id,
        BreastfeedingRecord.date == date
    ))
    
    # 2. Vytvoření nových záznamů (ignorujeme ID z frontendu, necháme DB vygenerovat nové)
    new_recs = []
    # Řazení je dobré pro konzistenci dat v DB, ale SQLModel/DB si s ním poradí i při refresh
    sorted_data = sorted(bf_data, key=lambda x: x.time)
    
    for item in sorted_data:
        # Vytvoříme slovník, vyhodíme případné ID a vnutíme správné child_id a date
        data_dict = item.model_dump()
        data_dict.pop('id', None) 
        
        new_recs.append(BreastfeedingRecord(**data_dict, child_id=child_id, date=date))
    
    session.add_all(new_recs)
    session.commit()
    
    for r in new_recs:
        session.refresh(r)
    return new_recs

def delete_bf_record(session: Session, bf_id: str) -> bool:
    """Smaže záznam o kojení podle ID."""
    bf = session.get(BreastfeedingRecord, bf_id)
    if not bf:
        return False

    session.delete(bf)
    session.commit()
    return True