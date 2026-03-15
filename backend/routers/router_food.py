from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..crud import crud_food as cfood
from ..models import FoodRecordCreate, FoodRecordUpdate, FoodRecordRead, FoodRecord
from ..db import get_session

router = APIRouter()


@router.get("/children/{child_id}/food", response_model=List[FoodRecordRead])
def list_food(
    child_id: str,
    date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    return cfood.get_food_for_child(session, child_id, date, category)


@router.post("/children/{child_id}/food", response_model=FoodRecordRead)
def save_food(child_id: str, food_data: FoodRecordCreate, session: Session = Depends(get_session)):
    return cfood.save_food_record(session, child_id, food_data)


@router.get("/children/{child_id}/food/{food_id}", response_model=FoodRecordRead)
def get_food(child_id: str, food_id: str, session: Session = Depends(get_session)):
    food = cfood.get_food_record(session, food_id)
    if not food or food.child_id != child_id:
        raise HTTPException(status_code=404, detail="Food record not found")
    return food


@router.put("/children/{child_id}/food/{food_id}", response_model=FoodRecordRead)
def update_food(child_id: str, food_id: str, food_data: FoodRecordUpdate, session: Session = Depends(get_session)):
    food = cfood.get_food_record(session, food_id)
    if not food or food.child_id != child_id:
        raise HTTPException(status_code=404, detail="Food record not found")
    updated = cfood.update_food_record(session, food_id, food_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated


@router.delete("/children/{child_id}/food/name/{food_name}")
def delete_food_by_name(child_id: str, food_name: str, session: Session = Depends(get_session)):
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