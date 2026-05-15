from fastapi import APIRouter, Depends, HTTPException, Header, Response
from sqlmodel import Session
from typing import List

from ..crud import crud_diary as cd
from ..models import Child, DiaryCreate, DiaryRead, DiaryUpdate
from ..db import get_session

router = APIRouter(
    prefix="/children/{child_id}/diary",
    tags=["Diary"]
)

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    """Ověří, zda dítě existuje a patří uživateli."""    
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Dítě nebylo nalezeno.")      
    if child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří!")      
    return child

@router.get("", response_model=List[DiaryRead])
def get_all(child_id: str, session: Session = Depends(get_session), x_user_id: str = Header(...)):
    verify_child_ownership(session, child_id, x_user_id)
    return cd.get_diary_for_child(session, child_id)

@router.post("", response_model=DiaryRead, status_code=201)
def create(child_id: str, data: DiaryCreate, session: Session = Depends(get_session), x_user_id: str = Header(...)):
    verify_child_ownership(session, child_id, x_user_id)
    return cd.create_diary_entry(session, child_id, data)

@router.put("/{diary_id}", response_model=DiaryRead)
def update(child_id: str, diary_id: str, data: DiaryUpdate, session: Session = Depends(get_session), x_user_id: str = Header(...)):
    verify_child_ownership(session, child_id, x_user_id)
    updated = cd.update_diary_entry(session, child_id, diary_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Entry not found")
    return updated

@router.delete("/{diary_id}", status_code=204)
def delete(child_id: str, diary_id: str, session: Session = Depends(get_session), x_user_id: str = Header(...)):
    verify_child_ownership(session, child_id, x_user_id)
    success = cd.delete_diary_entry(session, child_id, diary_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return Response(status_code=204)