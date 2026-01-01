from sqlmodel import Session, select
from typing import List, Optional
from ..models import Speaking, SpeakingCreate, SpeakingUpdate

# ============ WORD CRUD OPERATIONS ============

def create_word(
    session: Session,
    child_id: str,
    data: SpeakingCreate
):
    """Vytvoří nový záznam slova."""
    rec = Speaking(
        **data.dict(),
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def get_word(session: Session, word_id: str) -> Optional[Speaking]:
    """Získá slovo podle jeho ID."""
    return session.get(Speaking, word_id)

def get_words_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[Speaking]:
    """Získá všechna slova pro dané dítě."""
    query = select(Speaking).where(Speaking.child_id == child_id)
    if date:
        query = query.where(Speaking.date == date)
    return session.exec(query).all()

def update_word(session: Session, word_id: str, word_data: SpeakingUpdate) -> Optional[Speaking]:
    """Aktualizuje existující slovo."""
    word = session.get(Speaking, word_id)
    if not word:
        return None

    update_dict = word_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(word, key, value)

    session.add(word)
    session.commit()
    session.refresh(word)
    return word

def delete_word(session: Session, word_id: str) -> bool:
    """Smaže slovo."""
    word = session.get(Speaking, word_id)
    if not word:
        return False

    session.delete(word)
    session.commit()
    return True