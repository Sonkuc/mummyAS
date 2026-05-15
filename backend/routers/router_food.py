from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session
from ..crud import crud_food as cfood
from ..models import Child, FoodRecordRead, FoodRecordCreate, FoodRecordUpdate
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

@router.post("/children/{child_id}/food/sync", response_model=List[FoodRecordRead])
def sync_food(
    child_id: str, 
    food_list: List[FoodRecordCreate], 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """
    Hromadně synchronizuje jídla (Upsert podle food_name).
    Frontend pošle aktuální seznam všech jídel v kategorii/celkově.
    """
    verify_child_ownership(session, child_id, x_user_id)
    
    results = []
    for food_data in food_list:
        rec = cfood.save_food_record(session, child_id, food_data)
        results.append(rec)
    
    return results


@router.get("/children/{child_id}/food", response_model=List[FoodRecordRead])
def list_food(
    child_id: str,
    date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Zůstává pro úvodní načtení dat při startu aplikace."""
    verify_child_ownership(session, child_id, x_user_id)
    return cfood.get_food_for_child(session, child_id, date, category)

@router.delete("/children/{child_id}/food/name/{food_name}")
def delete_food_by_name(
    child_id: str, 
    food_name: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Smaže jídlo podle názvu (pro úplné odstranění vlastních potravin)."""
    verify_child_ownership(session, child_id, x_user_id)
    
    success = cfood.delete_food_by_name(session, child_id, food_name)
    if not success:
        raise HTTPException(status_code=404, detail="Záznam o jídle nebyl nalezen.")
        
    return {"status": "deleted"}