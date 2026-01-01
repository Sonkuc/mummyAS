from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..crud import crud_wh as cwh
from ..models import WeightHeightCreate, WeightHeightUpdate, WeightHeightRead
from ..db import get_session

router = APIRouter()


@router.get("/children/{child_id}/weight-height", response_model=List[WeightHeightRead])
def list_wh(child_id: str, session: Session = Depends(get_session)):
    """
    List all weight/height records for a child.
    """
    return cwh.get_wh_for_child(session, child_id)


@router.post(
    "/children/{child_id}/wh",
    response_model=WeightHeightRead
)
def create_wh(
    child_id: str,
    wh_data: WeightHeightCreate,
    session: Session = Depends(get_session)
):
    return cwh.create_wh_record(session, child_id, wh_data)

@router.get("/children/{child_id}/weight-height/{wh_id}", response_model=WeightHeightRead)
def get_wh(child_id: str, wh_id: str, session: Session = Depends(get_session)):
    """
    Get a single weight/height record by `wh_id`. Verifies it belongs to `child_id`.
    """
    rec = cwh.get_wh_record(session, wh_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Weight/height record not found")
    return rec


@router.put("/children/{child_id}/weight-height/{wh_id}", response_model=WeightHeightRead)
def update_wh(child_id: str, wh_id: str, wh_data: WeightHeightUpdate, session: Session = Depends(get_session)):
    """
    Update a weight/height record (partial update supported).
    """
    rec = cwh.get_wh_record(session, wh_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Weight/height record not found")
    updated = cwh.update_wh_record(session, wh_id, wh_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated


@router.delete("/children/{child_id}/weight-height/{wh_id}")
def delete_wh(child_id: str, wh_id: str, session: Session = Depends(get_session)):
    """
    Delete a weight/height record. Verifies it belongs to `child_id`.
    """
    rec = cwh.get_wh_record(session, wh_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Weight/height record not found")
    cwh.delete_wh_record(session, wh_id)
    return {"status": "deleted", "wh_id": wh_id}