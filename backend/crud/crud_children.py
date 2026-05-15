from sqlmodel import Session, select
from typing import List, Optional
from ..models import Child, ChildCreate, ChildUpdate, Speaking
from sqlalchemy.orm import selectinload 

def create_child(session: Session, child_data: ChildCreate, user_id: str) -> Child:
    """Vytvoří dítě a přiřadí mu user_id majitele."""
    child = Child.from_orm(child_data) 
    child.user_id = user_id
    
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

def get_child(session: Session, child_id: str, user_id: str) -> Optional[Child]:
    statement = (
        select(Child)
        .where(Child.id == child_id, Child.user_id == user_id)
        .options(
            selectinload(Child.milestones),
            selectinload(Child.teethRecords),
            selectinload(Child.words).selectinload(Speaking.entries), # Vnořená historie slov
            selectinload(Child.wh),
            selectinload(Child.foodRecords),
            selectinload(Child.sleepRecords),
            selectinload(Child.breastfeedingRecords),
            selectinload(Child.diaryRecords)
        )
    )
    return session.exec(statement).first()

def get_all_children(session: Session, user_id: str, name: Optional[str] = None) -> List[Child]:
    statement = select(Child).where(Child.user_id == user_id)
    if name:
        statement = statement.where(Child.name.contains(name))
    
    statement = statement.options(
        selectinload(Child.milestones),
        selectinload(Child.teethRecords),
        selectinload(Child.words).selectinload(Speaking.entries),
        selectinload(Child.wh),
        selectinload(Child.foodRecords),
        selectinload(Child.sleepRecords),
        selectinload(Child.breastfeedingRecords),
        selectinload(Child.diaryRecords)
    )
    return session.exec(statement).all()

def update_child(session: Session, child_id: str, child_data: ChildUpdate, user_id: str) -> Optional[Child]:
    """Aktualizuje informace o dítěti nebo jej vytvoří (UPSERT logika)."""
    db_child = get_child(session, child_id, user_id)
    
    if not db_child:
        # Logika pro vytvoření, pokud neexistuje (využívá UUID z frontendu)
        new_data = child_data.model_dump(exclude_unset=True)
        new_data["id"] = child_id
        new_data["user_id"] = user_id
        db_child = Child(**new_data)
        session.add(db_child)
    else:
        # Logika pro aktualizaci stávajícího
        update_data = child_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_child, key, value)
        db_child.user_id = user_id # Pojistka vlastnictví
        session.add(db_child)

    session.commit()
    session.refresh(db_child)
    return get_child(session, db_child.id, user_id)

def delete_child(session: Session, child_id: str, user_id: str) -> bool:
    """Smaže dítě, pouze pokud patří danému uživateli."""
    child = get_child(session, child_id, user_id)
    if not child:
        return False

    session.delete(child)
    session.commit()
    return True