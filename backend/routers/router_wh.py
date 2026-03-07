from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..crud import crud_wh as cwh
from ..models import WeightHeightCreate, WeightHeight, WeightHeightUpdate, WeightHeightRead
from ..db import get_session

router = APIRouter()


@router.get("/children/{child_id}/weight-height", response_model=List[WeightHeightRead])
def list_wh(child_id: str, session: Session = Depends(get_session)):
    """Seznam všech měření."""
    return cwh.get_wh_for_child(session, child_id)

@router.post("/children/{child_id}/weight-height", response_model=WeightHeightRead)
def create_wh(child_id: str, data: WeightHeightCreate, session: Session = Depends(get_session)):
    rec = WeightHeight(**data.dict(), child_id=child_id)
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

@router.put("/children/{child_id}/weight-height/{wh_id}", response_model=WeightHeightRead)
def update_wh_endpoint(child_id: str, wh_id: str, data: WeightHeightUpdate, session: Session = Depends(get_session)):
    # 1. Najít záznam
    wh_rec = session.get(WeightHeight, wh_id)
    
    # 2. Bezpečnostní kontrola: Pokud existuje, patří tomuto dítěti?
    if wh_rec and wh_rec.child_id != child_id:
        raise HTTPException(status_code=403, detail="Tento záznam patří jinému dítěti.")

    # 3. UPSERT Logika
    if not wh_rec:
        # CREATE (použijeme ID z mobilu)
        new_data = data.dict(exclude_unset=True)
        new_data["id"] = wh_id
        new_data["child_id"] = child_id
        wh_rec = WeightHeight(**new_data)
        session.add(wh_rec)
    else:
        wh_rec = cwh.update_wh(session, wh_rec, data)

    session.commit()
    session.refresh(wh_rec)
    return wh_rec

@router.delete("/children/{child_id}/weight-height/{wh_id}")
def delete_weight_height_endpoint(child_id: str, wh_id: str, session: Session = Depends(get_session)):
    rec = session.get(WeightHeight, wh_id)
    if rec:
        if rec.child_id == child_id:
            session.delete(rec)
            session.commit()
    return {"ok": True}