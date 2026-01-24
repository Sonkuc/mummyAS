from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..crud import crud_sleep as cs
from ..models import SleepRecord, SleepRecordCreate, SleepRecordUpdate, SleepRecordRead
from ..db import get_session
import datetime

router = APIRouter()

@router.get("/children/{child_id}/sleep", response_model=List[SleepRecordRead])
def list_sleep(child_id: str, date: Optional[str] = Query(None), session: Session = Depends(get_session)):
    """
    List sleep records for a child. Optional filter by `date` (YYYY-MM-DD).
    """
    return cs.get_sleep_for_child(session, child_id, date)


@router.post(
    "/children/{child_id}/sleep/bulk",
    response_model=List[SleepRecordRead]
)
def create_sleep_bulk(
    child_id: str,
    sleep_data: List[SleepRecordCreate],
    session: Session = Depends(get_session)
):
    results = []
    for item in sleep_data:
        new_rec = cs.create_sleep_record(session, child_id, item)
        results.append(new_rec)
    return results


# Pomocná funkce pro výpočet minut (můžeš ji dát i do jiného souboru)
@router.get("/children/{child_id}/sleep/stats")
def get_sleep_stats(child_id: str, session: Session = Depends(get_session)):
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

    # 1. Výpočet denních spánků (bez limitů, aby se to shodovalo s frontendem)
    for d in sorted_dates:
        recs = days_map[d]
        for i in range(len(recs) - 1):
            curr = recs[i]
            nxt = recs[i+1]
            if curr.state == "sleep":
                start_dt = datetime.datetime.strptime(f"{curr.date} {curr.time}", "%Y-%m-%d %H:%M")
                end_dt = datetime.datetime.strptime(f"{nxt.date} {nxt.time}", "%Y-%m-%d %H:%M")
                diff = int((end_dt - start_dt).total_seconds() // 60)
                # POZOR: Odstraněna horní hranice 1080, ponecháno jen diff > 0
                if diff > 0:
                    daily_results[d]["total_minutes"] += diff

    # 2. Logika nočního spánku (přesah mezi dny)
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
def get_sleep(child_id: str, sleep_id: str, session: Session = Depends(get_session)):
    """
    Get a single sleep record by `sleep_id`. Verifies it belongs to `child_id`.
    """
    rec = cs.get_sleep_record(session, sleep_id)
    if not rec or rec.child_id != child_id:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    return rec

@router.put("/children/{child_id}/sleep/day/{date}") # Přidáno /day/ pro jasné rozlišení
def update_sleep_day(
    child_id: str, 
    date: str, 
    sleep_data: List[SleepRecordCreate], 
    session: Session = Depends(get_session)
):
    # 1. Najdeme staré záznamy pro tento konkrétní den
    statement = select(SleepRecord).where(
        SleepRecord.child_id == child_id,
        SleepRecord.date == date
    )
    existing_records = session.exec(statement).all()
    
    for record in existing_records:
        session.delete(record)
    
    # 2. Vložíme nové záznamy ze seznamu
    for item in sleep_data:
        new_rec = SleepRecord(**item.dict(), child_id=child_id)
        session.add(new_rec)
    
    session.commit()
    return {"status": "success", "date": date}


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