from sqlmodel import Session, select
from typing import List, Optional
from ..models import FoodRecord, FoodRecordCreate, FoodRecordUpdate

def save_food_record(session: Session, child_id: str, data: FoodRecordCreate) -> FoodRecord:
    """
    Uloží záznam o jídle. 
    Pokud jídlo se stejným názvem pro dítě existuje, aktualizuje ho (Upsert).
    Tato funkce je srdcem hromadného syncu.
    """
    # Vyhledání podle jména a dítěte
    statement = select(FoodRecord).where(
        FoodRecord.child_id == child_id, 
        FoodRecord.food_name == data.food_name  
    )
    existing_rec = session.exec(statement).first()

    if existing_rec:
        # Update stávajícího záznamu (datum, poznámka, kategorie)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing_rec, key, value)
        db_obj = existing_rec
    else:
        # Vytvoření nového záznamu
        db_obj = FoodRecord(**data.model_dump(), child_id=child_id)
    
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj
    
def get_food_for_child(session: Session, child_id: str, date: Optional[str] = None, category: Optional[str] = None) -> List[FoodRecord]:
    """Vrátí všechny záznamy o jídle pro dané dítě. Ideální pro úvodní fetch do mobilu."""
    query = select(FoodRecord).where(FoodRecord.child_id == child_id)
    
    if date:
        query = query.where(FoodRecord.date == date)
    if category:
        query = query.where(FoodRecord.category == category)
        
    query = query.order_by(FoodRecord.date)
    
    return session.exec(query).all()

def delete_food_by_name(session: Session, child_id: str, food_name: str) -> bool:
    """
    Smaže záznam o jídle na základě jména v rámci konkrétního dítěte.
    Používá se pro úplné odstranění vlastních potravin z UI.
    """
    statement = select(FoodRecord).where(
        FoodRecord.child_id == child_id, 
        FoodRecord.food_name == food_name
    )
    record = session.exec(statement).first()
    if not record:
        return False
        
    session.delete(record)
    session.commit()
    return True


def get_food_record(session: Session, food_id: str) -> Optional[FoodRecord]:
    """Získá záznam o jídle podle jeho primárního ID."""
    return session.get(FoodRecord, food_id)
