from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List

from backend.crud import crud_diary as cd
from backend.models import DiaryCreate, DiaryRead, DiaryUpdate
from backend.db import get_session

router = APIRouter()

# router_diary.py

@router.get("/children/{child_id}/diary", response_model=List[DiaryRead])
def list_diary(child_id: str, session: Session = Depends(get_session)):
    """Seznam všech záznamů v deníku dítěte."""
    return cd.get_diary_for_child(session, child_id)

@router.post("/children/{child_id}/diary", response_model=DiaryRead)
def create_diary_entry(
    child_id: str, 
    diary_data: DiaryCreate, 
    session: Session = Depends(get_session)
):
    """Vytvoření nového záznamu do deníku."""
    return cd.create_diary_entry(session, child_id, diary_data)

@router.get("/children/{child_id}/diary/{diary_id}", response_model=DiaryRead)
def get_diary_entry(child_id: str, diary_id: str, session: Session = Depends(get_session)):
    """Detail jednoho záznamu z deníku s ověřením child_id."""
    diary = cd.get_diary_entry(session, diary_id)
    if not diary or diary.child_id != child_id:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    return diary

@router.put("/children/{child_id}/diary/{diary_id}", response_model=DiaryRead)
def update_diary_entry(
    child_id: str, 
    diary_id: str, 
    diary_data: DiaryUpdate, 
    session: Session = Depends(get_session)
):
    """Aktualizace záznamu v deníku."""
    db_diary = cd.get_diary_entry(session, diary_id)
    if not db_diary or db_diary.child_id != child_id:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    return cd.update_diary_entry(session, db_diary, diary_data)

@router.delete("/children/{child_id}/diary/{diary_id}")
def delete_diary_entry(child_id: str, diary_id: str, session: Session = Depends(get_session)):
    """Smazání záznamu z deníku."""
    diary = cd.get_diary_entry(session, diary_id)
    if not diary or diary.child_id != child_id:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    cd.delete_diary_entry(session, diary_id)
    return {"status": "deleted", "diary_id": diary_id}