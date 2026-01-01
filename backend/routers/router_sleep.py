from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..crud import crud_sleep as cs
from ..models import SleepRecord, SleepRecordCreate, SleepRecordUpdate, SleepRecordRead
from ..db import get_session

router = APIRouter()


@router.get("/children/{child_id}/sleep", response_model=List[SleepRecordRead])
def list_sleep(child_id: str, date: Optional[str] = Query(None), session: Session = Depends(get_session)):
    """
    List sleep records for a child. Optional filter by `date` (YYYY-MM-DD).
    """
    return cs.get_sleep_for_child(session, child_id, date)


@router.post(
    "/children/{child_id}/sleep",
    response_model=SleepRecordRead
)
def create_sleep(
    child_id: str,
    sleep_data: SleepRecordCreate,
    session: Session = Depends(get_session)
):
    return cs.create_sleep_record(session, child_id, sleep_data)


@router.get("/children/{child_id}/sleep/{sleep_id}", response_model=SleepRecordRead)
def get_sleep(child_id: str, sleep_id: str, session: Session = Depends(get_session)):
    """
    Get a single sleep record by `sleep_id`. Verifies it belongs to `child_id`.
    """
    rec = cs.get_sleep_record(session, sleep_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    return rec


@router.put("/children/{child_id}/sleep/{sleep_id}", response_model=SleepRecordRead)
def update_sleep(child_id: str, sleep_id: str, sleep_data: SleepRecordUpdate, session: Session = Depends(get_session)):
    """
    Update a sleep record (partial update supported).
    """
    rec = cs.get_sleep_record(session, sleep_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    updated = cs.update_sleep_record(session, sleep_id, sleep_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated


@router.delete("/children/{child_id}/sleep/{sleep_id}")
def delete_sleep(child_id: str, sleep_id: str, session: Session = Depends(get_session)):
    """
    Delete a sleep record. Verifies it belongs to `child_id`.
    """
    rec = cs.get_sleep_record(session, sleep_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    cs.delete_sleep_record(session, sleep_id)
    return {"status": "deleted", "sleep_id": sleep_id}