from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session
from ..crud import crud_wh as cwh
from ..models import Child, WeightHeight, WeightHeightCreate, WeightHeightUpdate, WeightHeightRead
from ..db import get_session

router = APIRouter()

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    """Pomocná funkce pro ověření, zda dítě patří přihlášenému uživateli."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing")
    
    child = session.get(Child, child_id)
    if not child or child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří!")
    return child

@router.get("/children/{child_id}/weight-height", response_model=List[WeightHeightRead])
def list_wh(
    child_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Seznam všech měření s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cwh.get_wh_for_child(session, child_id)

@router.post("/children/{child_id}/weight-height", response_model=WeightHeightRead)
def create_wh(
    child_id: str, 
    data: WeightHeightCreate, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Vytvoření nového měření s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    
    rec = WeightHeight(**data.dict(), child_id=child_id)
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

@router.put("/children/{child_id}/weight-height/{wh_id}", response_model=WeightHeightRead)
def update_wh_endpoint(
    child_id: str, 
    wh_id: str, 
    data: WeightHeightUpdate, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """UPSERT logika pro měření s ověřením vlastníka dítěte i záznamu."""
    # 1. Ověření, že uživatel má právo k tomuto dítěti
    verify_child_ownership(session, child_id, x_user_id)
    
    # 2. Najít záznam
    wh_rec = session.get(WeightHeight, wh_id)
    
    # 3. Bezpečnostní kontrola: Pokud záznam existuje, patří tomuto dítěti?
    if wh_rec and wh_rec.child_id != child_id:
        raise HTTPException(status_code=403, detail="Tento záznam patří jinému dítěti.")

    # 4. UPSERT Logika
    if not wh_rec:
        # CREATE (použijeme ID z mobilu)
        new_data = data.dict(exclude_unset=True)
        new_data["id"] = wh_id
        new_data["child_id"] = child_id
        wh_rec = WeightHeight(**new_data)
        session.add(wh_rec)
    else:
        # UPDATE
        wh_rec = cwh.update_wh(session, wh_rec, data)

    session.commit()
    session.refresh(wh_rec)
    return wh_rec

@router.delete("/children/{child_id}/weight-height/{wh_id}")
def delete_weight_height_endpoint(
    child_id: str, 
    wh_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Smazání měření s ověřením vlastníka."""
    # 1. Ověření uživatele
    verify_child_ownership(session, child_id, x_user_id)
    
    # 2. Ověření záznamu
    rec = session.get(WeightHeight, wh_id)
    if rec:
        if rec.child_id == child_id:
            session.delete(rec)
            session.commit()
        else:
            raise HTTPException(status_code=403, detail="Nemáte oprávnění smazat tento záznam.")
            
    return {"ok": True}