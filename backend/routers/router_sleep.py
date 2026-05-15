import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select

from ..crud import crud_sleep as cs
from ..models import Child, SleepRecord, SleepRecordCreate, SleepRecordRead, SleepDaySummary
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

@router.get("/children/{child_id}/sleep", response_model=List[SleepRecordRead])
def list_sleep(
    child_id: str, 
    date: Optional[str] = Query(None), 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    return cs.get_sleep_for_child(session, child_id, date)


@router.get("/children/{child_id}/sleep/stats", response_model=List[SleepDaySummary])
def get_sleep_stats(
    child_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Výpočet statistik spánku s ověřením hierarchie."""
    verify_child_ownership(session, child_id, x_user_id)
    
    statement = select(SleepRecord).where(SleepRecord.child_id == child_id)
    records = session.exec(statement).all()
    if not records: return []

    all_sorted = sorted(records, key=lambda x: (x.date, x.time))
    
    days_map = {}
    for r in all_sorted:
        if r.date not in days_map:
            days_map[r.date] = []
        days_map[r.date].append(r)

    sorted_dates = sorted(days_map.keys())
    daily_results = {d: {"total_minutes": 0, "night_minutes": 0} for d in sorted_dates}

    # 1. Výpočet denních spánků 
    for d in sorted_dates:
        recs = days_map[d]
        for i in range(len(recs) - 1):
            curr = recs[i]
            nxt = recs[i+1]
            if curr.state == "sleep":
                start_dt = datetime.datetime.strptime(f"{curr.date} {curr.time}", "%Y-%m-%d %H:%M")
                end_dt = datetime.datetime.strptime(f"{nxt.date} {nxt.time}", "%Y-%m-%d %H:%M")
                diff = int((end_dt - start_dt).total_seconds() // 60)
                if 0 < diff < 960:
                    daily_results[d]["total_minutes"] += diff

    # 2. Logika nočního spánku (mezi dny)
    for i in range(len(sorted_dates) - 1):
        d_today = sorted_dates[i]
        d_tomorrow = sorted_dates[i+1]
        
        last_sleep_today = next((r for r in reversed(days_map[d_today]) if r.state == "sleep"), None)
        first_awake_tomorrow = next((r for r in days_map[d_tomorrow] if r.state == "awake"), None)

        if last_sleep_today and first_awake_tomorrow:
            t1 = datetime.datetime.strptime(f"{last_sleep_today.date} {last_sleep_today.time}", "%Y-%m-%d %H:%M")
            t2 = datetime.datetime.strptime(f"{first_awake_tomorrow.date} {first_awake_tomorrow.time}", "%Y-%m-%d %H:%M")
            
            night_diff = int((t2 - t1).total_seconds() // 60)
            if night_diff > 0:
                daily_results[d_today]["total_minutes"] += night_diff
                daily_results[d_today]["night_minutes"] = night_diff

    return [{"date": d, **v} for d, v in sorted(daily_results.items())]

@router.get("/children/{child_id}/sleep/{sleep_id}", response_model=SleepRecordRead)
def get_sleep(
    child_id: str, 
    sleep_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    
    rec = cs.get_sleep_record(session, sleep_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    return rec

@router.put("/children/{child_id}/sleep/day/{date}", response_model=List[SleepRecordRead])
def update_sleep_day(
    child_id: str, 
    date: str, 
    sleep_data: List[SleepRecordCreate], 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Aktualizace celého dne spánku (Upsert logika)."""
    verify_child_ownership(session, child_id, x_user_id)
    return cs.sync_sleep_day(session, child_id, date, sleep_data)

@router.delete("/children/{child_id}/sleep/{sleep_id}")
def delete_sleep(
    child_id: str, 
    sleep_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    verify_child_ownership(session, child_id, x_user_id)
    
    rec = cs.get_sleep_record(session, sleep_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Sleep record not found")
        
    cs.delete_sleep_record(session, sleep_id)
    return {"status": "deleted", "sleep_id": sleep_id}