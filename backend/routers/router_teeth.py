from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..crud import crud_teeth as cteeth
from ..models import TeethRecordCreate, TeethRecordUpdate, TeethRecordRead
from ..db import get_session

router = APIRouter()


@router.get("/children/{child_id}/teeth", response_model=List[TeethRecordRead])
def list_teeth(child_id: str, session: Session = Depends(get_session)):
    """
    List all teeth records for a child.
    """
    return cteeth.get_teeth_for_child(session, child_id)


@router.post(
    "/children/{child_id}/teeth",
    response_model=TeethRecordRead
)
def create_teeth(
    child_id: str,
    teeth_data: TeethRecordCreate,
    session: Session = Depends(get_session)
):
    return cteeth.create_teeth_record(session, child_id, teeth_data)

@router.get("/children/{child_id}/teeth/{teeth_id}", response_model=TeethRecordRead)
def get_teeth(child_id: str, teeth_id: str, session: Session = Depends(get_session)):
    """
    Get a single teeth record by `teeth_id`. Verifies it belongs to `child_id`.
    """
    t = cteeth.get_teeth_record(session, teeth_id)
    if not t or t.child_id != child_id:
        raise HTTPException(status_code=404, detail="Teeth record not found")
    return t


@router.put("/children/{child_id}/teeth/{teeth_id}", response_model=TeethRecordRead)
def update_teeth(child_id: str, teeth_id: str, teeth_data: TeethRecordUpdate, session: Session = Depends(get_session)):
    """
    Update a teeth record (partial update supported).
    """
    t = cteeth.get_teeth_record(session, teeth_id)
    if not t or t.child_id != child_id:
        raise HTTPException(status_code=404, detail="Teeth record not found")
    updated = cteeth.update_teeth_record(session, teeth_id, teeth_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated


@router.delete("/children/{child_id}/teeth/{teeth_id}")
def delete_teeth(child_id: str, teeth_id: str, session: Session = Depends(get_session)):
    """
    Delete a teeth record. Verifies it belongs to `child_id`.
    """
    t = cteeth.get_teeth_record(session, teeth_id)
    if not t or t.child_id != child_id:
        raise HTTPException(status_code=404, detail="Teeth record not found")
    cteeth.delete_teeth_record(session, teeth_id)
    return {"status": "deleted", "teeth_id": teeth_id}