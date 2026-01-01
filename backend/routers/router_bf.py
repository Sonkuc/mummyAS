from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..crud import crud_bf as cbf
from ..models import BreastfeedingRecordCreate, BreastfeedingRecordUpdate, BreastfeedingRecordRead
from ..db import get_session

router = APIRouter()


@router.get("/children/{child_id}/breastfeeding", response_model=List[BreastfeedingRecordRead])
def list_bf(child_id: str, date: Optional[str] = Query(None), session: Session = Depends(get_session)):
    """
    List breastfeeding records for a child. Optionally filter by `date` (YYYY-MM-DD).
    """
    return cbf.get_bf_for_child(session, child_id, date)

@router.post(
    "/children/{child_id}/bf",
    response_model=BreastfeedingRecordRead
)
def create_bf(
    child_id: str,
    bf_data: BreastfeedingRecordCreate,
    session: Session = Depends(get_session)
):
    return cbf.create_bf_record(session, child_id, bf_data)

@router.get("/children/{child_id}/breastfeeding/{bf_id}", response_model=BreastfeedingRecordRead)
def get_bf(child_id: str, bf_id: str, session: Session = Depends(get_session)):
    """
    Get a single breastfeeding record by `bf_id`. Verifies the record belongs to `child_id`.
    """
    bf = cbf.get_bf_record(session, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    return bf


@router.put("/children/{child_id}/breastfeeding/{bf_id}", response_model=BreastfeedingRecordRead)
def update_bf(child_id: str, bf_id: str, bf_data: BreastfeedingRecordUpdate, session: Session = Depends(get_session)):
    """
    Update a breastfeeding record (partial update supported).
    """
    bf = cbf.get_bf_record(session, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    updated = cbf.update_bf_record(session, bf_id, bf_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated


@router.delete("/children/{child_id}/breastfeeding/{bf_id}")
def delete_bf(child_id: str, bf_id: str, session: Session = Depends(get_session)):
    """
    Delete a breastfeeding record by `bf_id`. Verifies the record belongs to `child_id`.
    """
    bf = cbf.get_bf_record(session, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    cbf.delete_bf_record(session, bf_id)
    return {"status": "deleted", "bf_id": bf_id}