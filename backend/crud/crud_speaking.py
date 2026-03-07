from sqlmodel import Session, select, delete
from typing import List, Optional
from ..models import Speaking, SpeakingCreate, SpeakingUpdate, WordEntry


def get_word(session: Session, word_id: str) -> Optional[Speaking]:
    """Získá slovo podle jeho ID."""
    return session.get(Speaking, word_id)

def get_words_for_child(session: Session, child_id: str) -> List[Speaking]:
    """Získá všechna slova pro dané dítě."""
    query = select(Speaking).where(Speaking.child_id == child_id)
    return session.exec(query).all()

def create_word(session: Session, child_id: str, data: SpeakingCreate):
    # Vytvoříme seznam objektů WordEntry
    db_entries = [WordEntry(**e.dict()) for e in data.entries] if data.entries else []
    
    # Vytvoříme hlavní slovo a rovnou mu přiřadíme entries
    db_word = Speaking(
        name=data.name,
        child_id=child_id,
        entries=db_entries  # SQLAlchemy se postará o word_id automaticky
    )
    
    session.add(db_word)
    session.commit()
    session.refresh(db_word)
    return db_word

def update_word(session: Session, word_id: str, word_data: SpeakingUpdate) -> Optional[Speaking]:
    db_word = session.get(Speaking, word_id)
    if not db_word:
        return None

    # 1. Aktualizace jména
    if word_data.name is not None:
        db_word.name = word_data.name

    # 2. Aktualizace entries - Smazání a znovu vytvoření (Replace strategie)
    if word_data.entries is not None:
        # 1. Hromadné smazání starých záznamů
        session.exec(delete(WordEntry).where(WordEntry.word_id == word_id))
        
        # 2. Přidání nových
        for entry_in in word_data.entries:
            new_entry = WordEntry(**entry_in.dict(), word_id=word_id)
            session.add(new_entry)

    session.add(db_word)
    session.commit()
    session.refresh(db_word)
    return db_word

def delete_word(session: Session, word_id: str) -> bool:
    """Smaže slovo i s historií (díky cascade delete v modelu)."""
    word = session.get(Speaking, word_id)
    if not word:
        return False
    session.delete(word)
    session.commit()
    return True

def add_word_entry(session: Session, word_id: str, entry_data: dict):
    db_entry = WordEntry(**entry_data, word_id=word_id)
    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)
    return db_entry