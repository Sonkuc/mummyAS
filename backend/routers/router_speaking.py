from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session
from ..crud import crud_speaking as cspeak
from ..models import Child, SpeakingRead, SpeakingCreate, SpeakingUpdate
from ..db import get_session

router = APIRouter()

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    """Pomocná funkce pro ověření, zda dítě patří přihlášenému uživateli."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing")
    
    child = session.get(Child, child_id)
    if not child or child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří!")
    return child

@router.get("/children/{child_id}/words", response_model=List[SpeakingRead])
def list_words(
    child_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Seznam slov dítěte s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cspeak.get_words_for_child(session, child_id)

@router.post("/children/{child_id}/words", response_model=SpeakingRead)
def create_word(
    child_id: str,
    speaking_data: SpeakingCreate,
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Vytvoření nového slova s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cspeak.create_word(session, child_id, speaking_data)

@router.post("/children/{child_id}/words/{word_id}/entries")
def add_entry(
    child_id: str,
    word_id: str,
    entry_data: dict, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Přidání nové výslovnosti k existujícímu slovu s kontrolou vlastnictví."""
    verify_child_ownership(session, child_id, x_user_id)
    
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found for this child")
    
    return cspeak.add_word_entry(session, word_id, entry_data)

@router.put("/children/{child_id}/words/{word_id}", response_model=SpeakingRead)
def update_word(
    child_id: str, 
    word_id: str, 
    word_data: SpeakingUpdate,
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Aktualizace slova s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found for this child")
        
    updated = cspeak.update_word(session, word_id, word_data)
    return updated

@router.delete("/children/{child_id}/words/{word_id}")
def delete_word(
    child_id: str, 
    word_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Smazání slova s ověřením vlastníka."""
    # 1. Nejdříve ověříme uživatele
    verify_child_ownership(session, child_id, x_user_id)
    
    # 2. Poté ověříme, zda slovo patří tomuto dítěti
    w = cspeak.get_word(session, word_id)
    if not w or str(w.child_id) != child_id:
        raise HTTPException(status_code=404, detail="Word not found")

    # 3. Volání CRUD smazání
    success = cspeak.delete_word(session, word_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete word from database")

    return {"message": "Word deleted successfully"}