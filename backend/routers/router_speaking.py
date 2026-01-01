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
    # OPRAVENO: Nyní volá správný název funkce z CRUDu
    return cspeak.create_word(session, child_id, speaking_data)

@router.get("/children/{child_id}/words/{word_id}", response_model=SpeakingRead)
def get_word(child_id: str, word_id: str, session: Session = Depends(get_session)):
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found")
    return w

@router.put("/children/{child_id}/words/{word_id}", response_model=SpeakingRead)
def update_word(child_id: str, word_id: str, word_data: SpeakingUpdate, session: Session = Depends(get_session)):
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found")
    
    updated = cspeak.update_word(session, word_id, word_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated

@router.delete("/children/{child_id}/words/{word_id}")
def delete_word(child_id: str, word_id: str, session: Session = Depends(get_session)):
    w = cspeak.get_word(session, word_id)
    if not w or w.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word not found")
        
    cspeak.delete_word(session, word_id)
    return {"status": "deleted", "word_id": word_id}