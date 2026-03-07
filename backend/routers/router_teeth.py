from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from ..crud import crud_teeth as cteeth
from ..models import TeethRecordCreate, TeethRecordRead
from ..db import get_session

router = APIRouter()

@router.get("/children/{child_id}/teeth", response_model=List[TeethRecordRead])
def list_teeth(child_id: str, session: Session = Depends(get_session)):
    """Načte aktuální stav zubů ze serveru."""
    return cteeth.get_teeth_for_child(session, child_id)

@router.put("/children/{child_id}/teeth/sync", response_model=List[TeethRecordRead])
def sync_teeth(
    child_id: str, 
    records: List[TeethRecordCreate], 
    session: Session = Depends(get_session)
):
    return cteeth.sync_teeth_for_child(session, child_id, records)