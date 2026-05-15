from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, delete

from ..crud import crud_wh as cwh
from ..models import Child, WeightHeight, WeightHeightCreate, WeightHeightRead
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

@router.get("/children/{child_id}/weight-height", response_model=List[WeightHeightRead])
def list_wh(
    child_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Získá všechna měření dítěte s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cwh.get_wh_for_child(session, child_id)

@router.put("/children/{child_id}/weight-height/sync", response_model=List[WeightHeightRead])
def sync_wh_collection(
    child_id: str, 
    data: List[WeightHeightCreate], 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """
    Smaže všechna měření dítěte a nahradí je novými z mobilu.
    """
    verify_child_ownership(session, child_id, x_user_id)
    
    # 1. Smazání starých záznamů
    session.exec(delete(WeightHeight).where(WeightHeight.child_id == child_id))
    
    # 2. Vložení nových
    new_records = []
    for item in data:
        rec = WeightHeight(**item.model_dump(), child_id=child_id)
        session.add(rec)
        new_records.append(rec)
    
    session.commit()
    for r in new_records: session.refresh(r)
    return new_records  