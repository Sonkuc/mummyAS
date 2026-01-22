from sqlmodel import Session, select
from typing import List, Optional
from ..models import Speaking, SpeakingCreate, SpeakingUpdate, WordEntry

# ============ WORD CRUD OPERATIONS ============

def get_word(session: Session, word_id: str) -> Optional[Speaking]:
    """Získá slovo podle jeho ID."""
    return session.get(Speaking, word_id)

def get_words_for_child(session: Session, child_id: str) -> List[Speaking]:
    """Získá všechna slova pro dané dítě."""
    query = select(Speaking).where(Speaking.child_id == child_id)
    return session.exec(query).all()

def create_word(session: Session, child_id: str, data: SpeakingCreate):
    """Vytvoří hlavní slovo a k němu i všechny vnořené záznamy (entries)."""
    rec = Speaking(
        name=data.name,
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)

    if data.entries:
        for entry_in in data.entries:
            db_entry = WordEntry(
                **entry_in.dict(),
                word_id=rec.id
            )
            session.add(db_entry)
        
        session.commit()
        session.refresh(rec)
        
    return rec

def update_word(session: Session, word_id: str, word_data: SpeakingUpdate) -> Optional[Speaking]:
    db_word = session.get(Speaking, word_id)
    if not db_word:
        return None

    # 1. Aktualizace jména
    if word_data.name is not None:
        db_word.name = word_data.name

    # 2. Aktualizace záznamů (entries) - Smazání a znovu vytvoření (Replace strategie)
    if word_data.entries is not None:
        # Smažeme staré
        statement = select(WordEntry).where(WordEntry.word_id == word_id)
        old_entries = session.exec(statement).all()
        for old in old_entries:
            session.delete(old)
        
        # Přidáme nové
        for entry_in in word_data.entries:
            new_entry = WordEntry(
                date=entry_in.date,
                note=entry_in.note,
                word_id=word_id
            )
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