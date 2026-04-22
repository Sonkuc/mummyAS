from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..crud import crud_food as cfood
from ..models import FoodRecordCreate, FoodRecordUpdate, FoodRecordRead, FoodRecord
from ..db import get_session

router = APIRouter()


from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select
from ..crud import crud_food as cfood
from ..models import Child, FoodRecord, FoodRecordCreate, FoodRecordUpdate, FoodRecordRead
from ..db import get_session

router = APIRouter()

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    """Ověří, zda dítě existuje a patří přihlášenému uživateli."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing")
    
    child = session.get(Child, child_id)
    if not child or child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří nebo neexistuje!")
    return child

@router.get("/children/{child_id}/food", response_model=List[FoodRecordRead])
def list_food(
    child_id: str,
    date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Načte seznam jídel pro konkrétní dítě s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cfood.get_food_for_child(session, child_id, date, category)


@router.post("/children/{child_id}/food", response_model=FoodRecordRead)
def save_food(
    child_id: str, 
    food_data: FoodRecordCreate, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Uloží záznam o jídle pouze pokud uživatel vlastní dané child_id."""
    verify_child_ownership(session, child_id, x_user_id)
    return cfood.save_food_record(session, child_id, food_data)


@router.get("/children/{child_id}/food/{food_id}", response_model=FoodRecordRead)
def get_food(
    child_id: str, 
    food_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Detail jídla s kontrolou vlastníka a vazby na dítě."""
    verify_child_ownership(session, child_id, x_user_id)
    
    food = cfood.get_food_record(session, food_id)
    if not food or food.child_id != child_id:
        raise HTTPException(status_code=404, detail="Food record not found")
    return food


@router.put("/children/{child_id}/food/{food_id}", response_model=FoodRecordRead)
def update_food(
    child_id: str, 
    food_id: str, 
    food_data: FoodRecordUpdate, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Aktualizace jídla s kontrolou vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    
    food = cfood.get_food_record(session, food_id)
    if not food or food.child_id != child_id:
        raise HTTPException(status_code=404, detail="Food record not found")
        
    updated = cfood.update_food_record(session, food_id, food_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated


@router.delete("/children/{child_id}/food/name/{food_name}")
def delete_food_by_name(
    child_id: str, 
    food_name: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Smazání jídla podle názvu s kontrolou vlastníka (ochrana před neoprávněným mazáním)."""
    verify_child_ownership(session, child_id, x_user_id)
    
    statement = select(FoodRecord).where(
        FoodRecord.child_id == child_id, 
        FoodRecord.food_name == food_name
    )
    record = session.exec(statement).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Food not found")
        
    session.delete(record)
    session.commit()
    return {"status": "deleted"}