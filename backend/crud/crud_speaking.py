from sqlmodel import Session, select, delete
from typing import List, Optional
from ..models import Speaking, SpeakingCreate, SpeakingUpdate, WordEntry, WordEntryCreate


def create_word(session: Session, child_id: str, data: SpeakingCreate) -> Speaking:
    """Vytvoří hlavní slovo a rovnou mu přiřadí seznam entries."""
    db_entries = [WordEntry(**e.model_dump()) for e in data.entries] if data.entries else []
    
    db_word = Speaking(
        name=data.name,
        child_id=child_id,
        entries=db_entries
    )
    
    session.add(db_word)
    session.commit()
    session.refresh(db_word)
    return db_word

def get_word(session: Session, word_id: str) -> Optional[Speaking]:
    """Získá slovo podle jeho primárního ID."""
    return session.get(Speaking, word_id)

def get_words_for_child(session: Session, child_id: str) -> List[Speaking]:
    """Získá všechna slova patřící konkrétnímu dítěti."""
    query = select(Speaking).where(Speaking.child_id == child_id)
    return session.exec(query).all()

def update_word(session: Session, word_id: str, word_data: SpeakingUpdate) -> Optional[Speaking]:
    """
    Aktualizuje slovo. Pokud jsou v data.entries poslány nové záznamy, 
    původní jsou smazány a nahrazeny (Replace strategie).
    """
    db_word = session.get(Speaking, word_id)
    if not db_word:
        return None

    # 1. Update jména slova
    if word_data.name is not None:
        db_word.name = word_data.name

    # 2. Nahrazení entries (pokud jsou v requestu)
    if word_data.entries is not None:
        # Smazání starých záznamů
        statement = delete(WordEntry).where(WordEntry.word_id == word_id)
        session.exec(statement)
        session.flush()  # Vynutí smazání v DB před vložením nových
        
        # Vložení nových záznamů
        for entry_in in word_data.entries:
            new_entry = WordEntry(**entry_in.model_dump(), word_id=word_id)
            session.add(new_entry)

    session.add(db_word)
    session.commit()
    session.refresh(db_word)
    return db_word

def delete_word(session: Session, word_id: str) -> bool:
    """Smaže slovo (vazby WordEntry se smažou díky cascade delete v modelu)."""
    word = session.get(Speaking, word_id)
    if not word:
        return False
    session.delete(word)
    session.commit()
    return True

def add_word_entry(session: Session, word_id: str, entry_data: WordEntryCreate) -> WordEntry:
    """Přidá jeden nový záznam výslovnosti k existujícímu slovu."""
    db_entry = WordEntry(**entry_data.model_dump(), word_id=word_id)
    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)
    return db_entry