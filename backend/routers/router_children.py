from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from backend.crud import crud_children as cc
from backend.models import ChildRead, ChildCreate, ChildUpdate, Child, BreastfeedingRecord, BreastfeedingRecordRead, BreastfeedingDaySummary
from backend.db import get_session
from datetime import datetime

router = APIRouter()

@router.get("/children", response_model=List[ChildRead])
def list_children(session: Session = Depends(get_session), name: Optional[str] = Query(None)):
    if name:
        return cc.search_children(session, name)
    return cc.get_all_children(session)

@router.get("/children/{child_id}/breastfeeding/stats", response_model=List[BreastfeedingDaySummary])
def get_bf_stats(child_id: str, session: Session = Depends(get_session)):
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
            
            # OCHRANA: Pokud je kojení delší než 2 hodiny (120 min), 
            # pravděpodobně jde o chybu zapomenutého stopnutí.
            if 0 < diff < 120:
                stats[rec.date] += diff
            else:
                # Volitelně: přičíst průměrnou délku kojení místo nesmyslu
                stats[rec.date] += 15 

    return [{"date": d, "total_minutes": m} for d, m in sorted(stats.items())]


@router.get("/children/{child_id}", response_model=ChildRead)
def get_child(child_id: str, session: Session = Depends(get_session)):
    child = cc.get_child(session, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child

@router.post("/children", response_model=ChildRead)
def create_child(child_data: ChildCreate, session: Session = Depends(get_session)):
    return cc.create_child(session, child_data)

@router.put("/children/{child_id}", response_model=ChildRead)
def update_child(child_id: str, child_data: ChildUpdate, session: Session = Depends(get_session)):
    # Získáme dítě z DB
    db_child = session.get(Child, child_id)
    if not db_child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Převedeme data na dict, exclude_unset zajistí, že nepřepíšeme pole, která neposíláme
    update_data = child_data.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_child, key, value)

    session.add(db_child)
    session.commit()
    session.refresh(db_child)
    return db_child


@router.delete("/children/{child_id}")
def delete_child(child_id: str, session: Session = Depends(get_session)):
    ok = cc.delete_child(session, child_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"status": "deleted", "child_id": child_id}