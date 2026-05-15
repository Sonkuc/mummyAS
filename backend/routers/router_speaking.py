from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session

from ..crud import crud_speaking as cspeak
from ..models import Child, SpeakingRead, SpeakingCreate, SpeakingUpdate
from ..db import get_session

router = APIRouter()

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    """Ověří, zda dítě existuje a patří uživateli."""    
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Dítě nebylo nalezeno.")      
    if child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří!")      
    return child

@router.get("/children/{child_id}/words", response_model=List[SpeakingRead])
def list_words(
    child_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    return cspeak.get_words_for_child(session, child_id)

@router.post("/children/{child_id}/words", response_model=SpeakingRead)
def create_word(
    child_id: str,
    speaking_data: SpeakingCreate,
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    return cspeak.create_word(session, child_id, speaking_data)

@router.post("/children/{child_id}/words/{word_id}/entries")
def add_entry(
    child_id: str,
    word_id: str,
    entry_data: dict, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Přidá novou výslovnost k existujícímu slovu s kontrolou integrity."""
    verify_child_ownership(session, child_id, x_user_id)
    
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Slovo nebylo nalezeno")
    
    cspeak.add_word_entry(session, word_id, entry_data)
    session.refresh(w)
    return w

def update_word(
    child_id: str, 
    word_id: str, 
    word_data: SpeakingUpdate,
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found for this child")
        
    return cspeak.update_word(session, word_id, word_data)

@router.delete("/children/{child_id}/words/{word_id}")
def delete_word(
    child_id: str, 
    word_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found")

    success = cspeak.delete_word(session, word_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete word")

    return {"message": "Word deleted successfully"}