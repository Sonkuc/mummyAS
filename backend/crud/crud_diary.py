from sqlmodel import Session, select
from typing import List, Optional
from ..models import Diary, DiaryCreate, DiaryUpdate

def create_diary_entry(session: Session, child_id: str, data: DiaryCreate) -> Diary:
    db_diary = Diary(**data.model_dump(), child_id=child_id)
    session.add(db_diary)
    session.commit()
    session.refresh(db_diary)
    return db_diary

def get_diary_for_child(session: Session, child_id: str) -> List[Diary]:
    # Seřazení podle data sestupně je pro deník klíčové
    statement = select(Diary).where(Diary.child_id == child_id).order_by(Diary.date.desc())
    return session.exec(statement).all()

def update_diary_entry(session: Session, child_id: str, diary_id: str, data: DiaryUpdate) -> Optional[Diary]:
    # Najdeme záznam, který patří konkrétnímu dítěti (bezpečnostní pojistka)
    statement = select(Diary).where(Diary.id == diary_id, Diary.child_id == child_id)
    db_diary = session.exec(statement).first()
    
    if not db_diary:
        return None

    # Update dat
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_diary, key, value)
    
    session.add(db_diary)
    session.commit()
    session.refresh(db_diary)
    return db_diary

def delete_diary_entry(session: Session, child_id: str, diary_id: str) -> bool:
    statement = select(Diary).where(Diary.id == diary_id, Diary.child_id == child_id)
    db_diary = session.exec(statement).first()
    
    if not db_diary:
        return False
        
    session.delete(db_diary)
    session.commit()
    return True