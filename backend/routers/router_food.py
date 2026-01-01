from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..crud import crud_food as cfood
from ..models import FoodRecordCreate, FoodRecordUpdate, FoodRecordRead
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


@router.post(
    "/children/{child_id}/food",
    response_model=FoodRecordRead
)
def create_food(
    child_id: str,
    food_data: FoodRecordCreate,
    session: Session = Depends(get_session)
):
    return cfood.create_food_record(session, child_id, food_data)

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


@router.delete("/children/{child_id}/food/{food_id}")
def delete_food(child_id: str, food_id: str, session: Session = Depends(get_session)):
    food = cfood.get_food_record(session, food_id)
    if not food or food.child_id != child_id:
        raise HTTPException(status_code=404, detail="Food record not found")
    cfood.delete_food_record(session, food_id)
    return {"status": "deleted", "food_id": food_id}