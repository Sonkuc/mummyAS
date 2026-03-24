from sqlmodel import Session, select
from typing import List, Optional
from backend.models import Diary, DiaryCreate, DiaryUpdate

def create_diary_entry(session: Session, child_id: str, data: DiaryCreate) -> Diary:
    db_diary = Diary(
        **data.dict(),
        child_id=child_id
    )
    session.add(db_diary)
    session.commit()
    session.refresh(db_diary)
    return db_diary

def get_diary_entry(session: Session, diary_id: str) -> Optional[Diary]:
    return session.get(Diary, diary_id)

def get_diary_for_child(session: Session, child_id: str) -> List[Diary]:
    query = (
        select(Diary)
        .where(Diary.child_id == child_id)
        .order_by(Diary.date.desc())
    )
    return session.exec(query).all()

def update_diary_entry(session: Session, db_diary: Diary, diary_data: DiaryUpdate) -> Diary:
    update_dict = diary_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_diary, key, value)
    session.add(db_diary)
    session.commit()
    session.refresh(db_diary)
    return db_diary

def delete_diary_entry(session: Session, diary_id: str) -> bool:
    db_diary = session.get(Diary, diary_id)
    if not db_diary:
        return False
    session.delete(db_diary)
    session.commit()
    return True