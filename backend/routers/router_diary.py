from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session
from typing import List

from backend.crud import crud_diary as cd
from backend.models import Child, DiaryCreate, DiaryRead, DiaryUpdate
from backend.db import get_session

router = APIRouter()

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    child = session.get(Child, child_id)
    if not child or child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří!")
    return child

@router.get("/children/{child_id}/diary", response_model=List[DiaryRead])
def list_diary(
    child_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Seznam všech záznamů v deníku dítěte s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cd.get_diary_for_child(session, child_id)

@router.post("/children/{child_id}/diary", response_model=DiaryRead)
def create_diary_entry(
    child_id: str, 
    diary_data: DiaryCreate, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Vytvoření nového záznamu do deníku s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cd.create_diary_entry(session, child_id, diary_data)

@router.get("/children/{child_id}/diary/{diary_id}", response_model=DiaryRead)
def get_diary_entry(
    child_id: str, 
    diary_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Detail jednoho záznamu z deníku s dvojitým ověřením (vlastník i vazba na dítě)."""
    verify_child_ownership(session, child_id, x_user_id)
    
    diary = cd.get_diary_entry(session, diary_id)
    if not diary or diary.child_id != child_id:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    return diary

@router.put("/children/{child_id}/diary/{diary_id}", response_model=DiaryRead)
def update_diary_entry(
    child_id: str, 
    diary_id: str, 
    diary_data: DiaryUpdate, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Aktualizace záznamu v deníku s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    
    db_diary = cd.get_diary_entry(session, diary_id)
    if not db_diary or db_diary.child_id != child_id:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    return cd.update_diary_entry(session, db_diary, diary_data)

@router.delete("/children/{child_id}/diary/{diary_id}")
def delete_diary_entry(
    child_id: str, 
    diary_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Smazání záznamu z deníku s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    
    diary = cd.get_diary_entry(session, diary_id)
    if not diary or diary.child_id != child_id:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    cd.delete_diary_entry(session, diary_id)
    return {"status": "deleted", "diary_id": diary_id}