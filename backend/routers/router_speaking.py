from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..crud import crud_speaking as cspeak
from ..models import SpeakingCreate, SpeakingUpdate, SpeakingRead
from ..db import get_session

router = APIRouter()

@router.get("/children/{child_id}/words", response_model=List[SpeakingRead])
def list_words(child_id: str, session: Session = Depends(get_session)):
    return cspeak.get_words_for_child(session, child_id)

@router.post("/children/{child_id}/words", response_model=SpeakingRead)
def create_word(
    child_id: str,
    speaking_data: SpeakingCreate,
    session: Session = Depends(get_session)
):
    # Tento CRUD teď rozebere payload na Slovo + Historii
    return cspeak.create_word(session, child_id, speaking_data)

# Pokud chceš endpoint pro přidání nové výslovnosti k existujícímu slovu:
@router.post("/children/{child_id}/words/{word_id}/entries")
def add_entry(
    child_id: str,
    word_id: str,
    entry_data: dict, # Zde můžeš vytvořit WordEntryCreate model
    session: Session = Depends(get_session)
):
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found")
    
    return cspeak.add_word_entry(session, word_id, entry_data)

@router.put("/children/{child_id}/words/{word_id}", response_model=SpeakingRead)
def update_word(
    child_id: str, 
    word_id: str, 
    word_data: SpeakingUpdate, # Pozor: SpeakingUpdate musí v models.py obsahovat entries!
    session: Session = Depends(get_session)
):
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found")
        
    updated = cspeak.update_word(session, word_id, word_data)
    return updated