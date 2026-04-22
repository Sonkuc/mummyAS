from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, delete, select

from ..crud import crud_bf as cbf
from ..models import Child, BreastfeedingRecordCreate, BreastfeedingRecord, BreastfeedingRecordRead, BreastfeedingDaySummary
from ..db import get_session
from datetime import datetime

router = APIRouter()

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    child = session.get(Child, child_id)
    if not child or child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří!")
    return child

@router.get("/children/{child_id}/breastfeeding", response_model=List[BreastfeedingRecordRead])
def list_bf(child_id: str, date: Optional[str] = Query(None), session: Session = Depends(get_session), x_user_id: str = Header(None)):
    """
    List breastfeeding records for a child. Optionally filter by `date` (YYYY-MM-DD).
    """
    verify_child_ownership(session, child_id, x_user_id)
    return cbf.get_bf_for_child(session, child_id, date)

@router.post("/children/{child_id}/breastfeeding/bulk", response_model=List[BreastfeedingRecordRead])
def create_bf_bulk(
    child_id: str,
    bf_list: List[BreastfeedingRecordCreate],
    session: Session = Depends(get_session),
    x_user_id: str = Header(None) # PŘIDÁNO
):
    verify_child_ownership(session, child_id, x_user_id) 
    
    results = []
    for item in bf_list:
        new_rec = BreastfeedingRecord(**item.dict(), child_id=child_id)
        session.add(new_rec)
        results.append(new_rec)
    
    session.commit()
    for r in results: session.refresh(r)
    return results

@router.get("/children/{child_id}/breastfeeding/{bf_id}", response_model=BreastfeedingRecordRead)
def get_bf(child_id: str, bf_id: str, session: Session = Depends(get_session), x_user_id: str = Header(None)):
    """
    Get a single breastfeeding record by `bf_id`. Verifies the record belongs to `child_id`.
    """
    verify_child_ownership(session, child_id, x_user_id)
    bf = cbf.get_bf_record(session, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    return bf


@router.put("/children/{child_id}/breastfeeding/day/{date}", response_model=List[BreastfeedingRecordRead])
def update_bf_day(
    child_id: str, 
    date: str, 
    bf_data: List[BreastfeedingRecordCreate], 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    verify_child_ownership(session, child_id, x_user_id)

    # 2. Hromadné smazání původních záznamů pro daný den
    delete_statement = delete(BreastfeedingRecord).where(
        BreastfeedingRecord.child_id == child_id,
        BreastfeedingRecord.date == date
    )
    session.exec(delete_statement)
    
    # 3. Seřazení a vložení nových
    sorted_data = sorted(bf_data, key=lambda x: x.time)
    
    new_records = []
    for item in sorted_data:
        rec_data = item.dict()
        new_rec = BreastfeedingRecord(**rec_data, child_id=child_id)
        session.add(new_rec)
        new_records.append(new_rec)
    
    session.commit()
    for r in new_records: session.refresh(r)
    return new_records

@router.get("/children/{child_id}/breastfeeding/stats", response_model=List[BreastfeedingDaySummary])
def get_bf_stats(child_id: str, session: Session = Depends(get_session), x_user_id: str = Header(None)):
    verify_child_ownership(session, child_id, x_user_id)
    statement = select(BreastfeedingRecord).where(
        BreastfeedingRecord.child_id == child_id
    ).order_by(BreastfeedingRecord.date, BreastfeedingRecord.time)
    
    records = session.exec(statement).all()
    stats = {}
    active_starts = {} 

    for rec in records:
        if rec.date not in stats:
            stats[rec.date] = 0
        
        if rec.state == "start":
            active_starts[rec.date] = rec.time
        elif rec.state == "stop" and rec.date in active_starts:
            start_time = active_starts.pop(rec.date)
            
            t1 = datetime.strptime(start_time, "%H:%M")
            t2 = datetime.strptime(rec.time, "%H:%M")
            diff = (t2 - t1).seconds // 60
            if 0 < diff < 120:
                stats[rec.date] += diff

    return [{"date": d, "total_minutes": m} for d, m in sorted(stats.items())]


@router.delete("/children/{child_id}/breastfeeding/{bf_id}")
def delete_bf(child_id: str, bf_id: str, session: Session = Depends(get_session), x_user_id: str = Header(None)):
    """
    Delete a breastfeeding record by `bf_id`. Verifies the record belongs to `child_id`.
    """
    verify_child_ownership(session, child_id, x_user_id)
    bf = cbf.get_bf_record(session, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    cbf.delete_bf_record(session, bf_id)
    return {"status": "deleted", "bf_id": bf_id}