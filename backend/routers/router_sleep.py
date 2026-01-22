from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

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
def to_minutes(time_str: str):
    try:
        h, m = map(int, time_str.split(':'))
        return h * 60 + m
    except:
        return 0
    
@router.get("/children/{child_id}/sleep/stats")
def get_sleep_stats(child_id: str, session: Session = Depends(get_session)):
    # 1. Načtení dat přímo ze session
    statement = select(SleepRecord).where(SleepRecord.child_id == child_id)
    records = session.exec(statement).all()
    
    if not records:
        return []

    # 2. Seskupení podle data
    days = {}
    for r in records:
        if r.date not in days:
            days[r.date] = []
        days[r.date].append(r)
    
    stats = []
    sorted_dates = sorted(days.keys())
    
    for date in sorted_dates:
        # Seřadíme záznamy v daném dni podle času
        day_records = sorted(days[date], key=lambda x: x.time)
        total_minutes = 0
        night_minutes = 0
        
        # Procházíme páry sleep -> awake
        for i in range(len(day_records) - 1):
            curr = day_records[i]
            nxt = day_records[i+1]
            
            if curr.state == "sleep":
                duration = to_minutes(nxt.time) - to_minutes(curr.time)
                if duration > 0:
                    total_minutes += duration
                    # Toto určuje, co je NOC:
                    hour = int(curr.time.split(':')[0])
                    if hour >= 19 or hour < 7:  # Pokud spánek začal mezi 19h večer a 7h ráno
                        night_minutes += duration
        
        stats.append({
            "date": date,
            "total_minutes": total_minutes,
            "night_minutes": night_minutes
        })
        
    return stats

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