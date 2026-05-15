from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session
from ..crud import crud_children as cc
from ..models import ChildRead, ChildCreate, ChildUpdate
from ..db import get_session

router = APIRouter()

@router.get("/children", response_model=List[ChildRead])
def list_children(
    session: Session = Depends(get_session), 
    name: Optional[str] = Query(None),
    x_user_id: str = Header(...)
):
    return cc.get_all_children(session, x_user_id, name)

@router.get("/children/{child_id}", response_model=ChildRead)
def get_child(
    child_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    child = cc.get_child(session, child_id, x_user_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found or access denied")
    return child

@router.post("/children", response_model=ChildRead)
def create_child(
    child_data: ChildCreate, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    return cc.create_child(session, child_data, x_user_id)

@router.put("/children/{child_id}", response_model=ChildRead)
def update_child(
    child_id: str, 
    child_data: ChildUpdate, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    child = cc.update_child(session, child_id, child_data, x_user_id)
    if not child:
        raise HTTPException(status_code=400, detail="Update failed")
    return child

@router.delete("/children/{child_id}")
def delete_child(
    child_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    success = cc.delete_child(session, child_id, x_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Child not found or access denied")
    return {"status": "deleted", "child_id": child_id}