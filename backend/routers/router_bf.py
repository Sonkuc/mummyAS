from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select
from datetime import datetime

from ..crud import crud_bf as cbf
from ..models import Child, BreastfeedingRecordCreate, BreastfeedingRecord, BreastfeedingRecordRead, BreastfeedingDaySummary
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

@router.get("/children/{child_id}/breastfeeding", response_model=List[BreastfeedingRecordRead])
def list_bf(
    child_id: str, 
    date: Optional[str] = Query(None), 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    return cbf.get_bf_for_child(session, child_id, date)

@router.get("/children/{child_id}/breastfeeding/{bf_id}", response_model=BreastfeedingRecordRead)
def get_bf(
    child_id: str, 
    bf_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
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
    x_user_id: str = Header(...)
):
    """Synchronizuje záznamy pro celý den (Delete staré -> Create nové)."""
    verify_child_ownership(session, child_id, x_user_id)
    return cbf.sync_bf_day(session, child_id, date, bf_data)

@router.get("/children/{child_id}/breastfeeding/stats", response_model=List[BreastfeedingDaySummary])
def get_bf_stats(
    child_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    """Výpočet statistik délky kojení pro dané dítě."""
    verify_child_ownership(session, child_id, x_user_id)
    
    # Načtení všech záznamů dítěte pro výpočet statistik
    statement = select(BreastfeedingRecord).where(BreastfeedingRecord.child_id == child_id).order_by(BreastfeedingRecord.date, BreastfeedingRecord.time)
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
            try:
                t1 = datetime.strptime(start_time, "%H:%M")
                t2 = datetime.strptime(rec.time, "%H:%M")
                diff = (t2 - t1).seconds // 60
                if 0 < diff < 120: # Ochrana proti nesmyslným datům
                    stats[rec.date] += diff
            except ValueError:
                continue

    return [{"date": d, "total_minutes": m} for d, m in sorted(stats.items())]

@router.delete("/children/{child_id}/breastfeeding/{bf_id}")
def delete_bf(
    child_id: str, 
    bf_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    
    # Ověření, že záznam patří danému dítěti
    bf = cbf.get_bf_record(session, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    
    cbf.delete_bf_record(session, bf_id)
    return {"status": "deleted", "bf_id": bf_id}