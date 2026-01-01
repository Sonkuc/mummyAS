from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from backend.crud import crud_children as cc
from backend.models import ChildRead, ChildCreate, ChildUpdate
from backend.db import get_session

router = APIRouter()


@router.get("/children", response_model=List[ChildRead])
def list_children(session: Session = Depends(get_session), name: Optional[str] = Query(None)):
    if name:
        return cc.search_children(session, name)
    return cc.get_all_children(session)


@router.post("/children", response_model=ChildRead)
def create_child(child_data: ChildCreate, session: Session = Depends(get_session)):
    return cc.create_child(session, child_data)


@router.get("/children/{child_id}", response_model=ChildRead)
def get_child(child_id: str, session: Session = Depends(get_session)):
    child = cc.get_child(session, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


@router.put("/children/{child_id}", response_model=ChildRead)
def update_child(child_id: str, child_data: ChildUpdate, session: Session = Depends(get_session)):
    updated = cc.update_child(session, child_id, child_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Child not found")
    return updated


@router.delete("/children/{child_id}")
def delete_child(child_id: str, session: Session = Depends(get_session)):
    ok = cc.delete_child(session, child_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"status": "deleted", "child_id": child_id}