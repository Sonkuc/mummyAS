from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select
from datetime import datetime

from ..crud import crud_bf as cbf
from ..models import Child, BreastfeedingRecordCreate, BreastfeedingRecord, BreastfeedingRecordRead, BreastfeedingDaySummary, BreastfeedingSyncResponse
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

@router.put("/children/{child_id}/breastfeeding/day/{date}", response_model=BreastfeedingSyncResponse)
def update_bf_day(
    child_id: str, 
    date: str, 
    bf_data: List[BreastfeedingRecordCreate],
    clear_timer: bool = Query(False), 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Synchronizuje záznamy pro celý den a vrací je spolu s novým stavem časovače."""
    verify_child_ownership(session, child_id, x_user_id)
    
    if clear_timer:
        # Frontend si vyžádal smazání časovače
        records, current_mode = cbf.sync_bf_day(
            session, child_id, date, bf_data, explicit_mode=None, has_explicit_mode=True
        )
    else:
        # Klasický sync, necháme backend běžet postaru (případně dopočítat automaticky)
        records, current_mode = cbf.sync_bf_day(
            session, child_id, date, bf_data, has_explicit_mode=False
        )
    
    return {
        "records": records,
        "currentModeFeed": current_mode
    }

@router.get("/children/{child_id}/breastfeeding/stats", response_model=List[BreastfeedingDaySummary])
def get_bf_stats(
    child_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    """Výpočet statistik délky kojení pro dané dítě (plně podporuje přechod přes půlnoc)."""
    verify_child_ownership(session, child_id, x_user_id)
    
    # Načtení všech záznamů dítěte seřazených chronologicky
    statement = select(BreastfeedingRecord).where(BreastfeedingRecord.child_id == child_id).order_by(BreastfeedingRecord.date, BreastfeedingRecord.time)
    records = session.exec(statement).all()
    
    stats = {}
    active_start_rec: Optional[BreastfeedingRecord] = None 

    for rec in records:
        if rec.date not in stats:
            stats[rec.date] = 0
        
        if rec.state == "start":
            active_start_rec = rec

        elif rec.state == "stop" and active_start_rec is not None:
            try:
                start_str = f"{active_start_rec.date} {active_start_rec.time}"
                stop_str = f"{rec.date} {rec.time}"
                
                t1 = datetime.strptime(start_str, "%Y-%m-%d %H:%M")
                t2 = datetime.strptime(stop_str, "%Y-%m-%d %H:%M")
                
                diff = int((t2 - t1).total_seconds() // 60)
                
                if 0 < diff < 120:
                    start_date = active_start_rec.date
                    if start_date not in stats:
                        stats[start_date] = 0
                    stats[start_date] += diff
                    
            except ValueError:
                # Pokud by selhal formát času/data, přeskočíme a pokračujeme
                continue
            finally:
                active_start_rec = None

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