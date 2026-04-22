from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session
from ..crud import crud_teeth as cteeth
from ..models import Child, TeethRecordRead, TeethRecordCreate
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

@router.get("/children/{child_id}/teeth", response_model=List[TeethRecordRead])
def list_teeth(
    child_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Načte aktuální stav zubů s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cteeth.get_teeth_for_child(session, child_id)

@router.put("/children/{child_id}/teeth/sync", response_model=List[TeethRecordRead])
def sync_teeth(
    child_id: str, 
    records: List[TeethRecordCreate], 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Synchronizuje stav zubů (hromadný update/insert) s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cteeth.sync_teeth_for_child(session, child_id, records)