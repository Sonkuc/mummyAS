from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..crud import crud_bf as cbf
from ..models import BreastfeedingRecordCreate, BreastfeedingRecord, BreastfeedingRecordRead
from ..db import get_session

router = APIRouter()

@router.get("/children/{child_id}/breastfeeding", response_model=List[BreastfeedingRecordRead])
def list_bf(child_id: str, date: Optional[str] = Query(None), session: Session = Depends(get_session)):
    """
    List breastfeeding records for a child. Optionally filter by `date` (YYYY-MM-DD).
    """
    return cbf.get_bf_for_child(session, child_id, date)

@router.post("/children/{child_id}/breastfeeding/bulk")
def create_bf_bulk(
    child_id: str,
    bf_list: List[BreastfeedingRecordCreate], # Přijímá seznam
    session: Session = Depends(get_session)
):
    results = []
    for item in bf_list:
        new_rec = cbf.create_bf_record(session, child_id, item)
        results.append(new_rec)
    return results

@router.get("/children/{child_id}/breastfeeding/{bf_id}", response_model=BreastfeedingRecordRead)
def get_bf(child_id: str, bf_id: str, session: Session = Depends(get_session)):
    """
    Get a single breastfeeding record by `bf_id`. Verifies the record belongs to `child_id`.
    """
    bf = cbf.get_bf_record(session, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    return bf


@router.put("/children/{child_id}/breastfeeding/day/{date}", response_model=List[BreastfeedingRecordRead])
def update_bf_day(
    child_id: str, 
    date: str, 
    bf_data: List[BreastfeedingRecordCreate], 
    session: Session = Depends(get_session)
):
    # 1. Najdeme a smažeme staré záznamy pro tento konkrétní den
    statement = select(BreastfeedingRecord).where(
        BreastfeedingRecord.child_id == child_id,
        BreastfeedingRecord.date == date
    )
    existing_records = session.exec(statement).all()
    for record in existing_records:
        session.delete(record)
    
    # 2. Seřadíme nová data podle času (prevence chaosu v ID/pořadí)
    sorted_data = sorted(bf_data, key=lambda x: x.time)
    
    # 3. Vložíme nové záznamy
    new_records = []
    for item in sorted_data:
        new_rec = BreastfeedingRecord(**item.dict(), child_id=child_id)
        session.add(new_rec)
        new_records.append(new_rec)
    
    session.commit()
    # 4. Refreshneme záznamy, aby měly ID z databáze pro návrat
    for r in new_records:
        session.refresh(r)
        
    return new_records

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