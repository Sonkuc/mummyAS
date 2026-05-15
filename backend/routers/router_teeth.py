from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session

from ..crud import crud_teeth as cteeth
from ..models import Child, TeethRecordRead, TeethRecordCreate
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

@router.get("/children/{child_id}/teeth", response_model=List[TeethRecordRead])
def list_teeth(
    child_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Načte aktuální schéma zubů dítěte s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cteeth.get_teeth_for_child(session, child_id)

@router.put("/children/{child_id}/teeth/sync", response_model=List[TeethRecordRead])
def sync_teeth(
    child_id: str, 
    records: List[TeethRecordCreate], 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """
    Hromadně aktualizuje stav zubů dítěte.
    Před smazáním starých dat ověřuje, zda child_id patří přihlášenému uživateli.
    """
    verify_child_ownership(session, child_id, x_user_id)
    return cteeth.sync_teeth_for_child(session, child_id, records)