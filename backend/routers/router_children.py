from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session, select

from backend.crud import crud_children as cc
from backend.models import ChildRead, ChildCreate, ChildUpdate, Child
from backend.db import get_session

router = APIRouter()

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    child = session.get(Child, child_id)
    if not child or child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří!")
    return child

@router.get("/children", response_model=List[ChildRead])
def list_children(
    session: Session = Depends(get_session), 
    name: Optional[str] = Query(None),
    x_user_id: str = Header(None) # Zachytí X-User-Id z Headeru
):
    # 1. Kontrola, zda ID uživatele vůbec přišlo
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID missing in headers")

    # 2. Základní dotaz: "Vyber děti, kde user_id odpovídá přihlášenému uživateli"
    statement = select(Child).where(Child.user_id == x_user_id)

    # 3. Pokud uživatel navíc hledá podle jména, přidáme další filtr
    if name:
        statement = statement.where(Child.name.contains(name))

    # 4. Spuštění dotazu
    results = session.exec(statement).all()
    return results

@router.get("/children/{child_id}", response_model=ChildRead)
def get_child(child_id: str, session: Session = Depends(get_session), x_user_id: str = Header(None)):
    child = verify_child_ownership(session, child_id, x_user_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


@router.post("/children", response_model=ChildRead)
def create_child(
    child_data: ChildCreate, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None) 
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing")
    
    # Převedeme data na slovník a přidáme k nim user_id z hlavičky
    child_dict = child_data.dict()
    child_dict["user_id"] = x_user_id 
    
    db_child = Child(**child_dict)
    session.add(db_child)
    session.commit()
    session.refresh(db_child)
    return db_child

@router.put("/children/{child_id}", response_model=ChildRead)
def update_child(
    child_id: str, 
    child_data: ChildUpdate, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)  # Získáme ID z hlavičky, kterou frontend posílá
):
    db_child = session.get(Child, child_id)
    
    if not db_child:
        # PŘI VYTVÁŘENÍ user_id přidat ručně, protože v ChildUpdate modelu pravděpodobně není.
        new_data = child_data.dict(exclude_unset=True)
        new_data["id"] = child_id
        
        # Pokud v datech není user_id, vezmeme ho z hlavičky
        if "user_id" not in new_data or new_data["user_id"] is None:
            new_data["user_id"] = x_user_id
            
        db_child = Child(**new_data)
        session.add(db_child)
    else:
        # PŘI AKTUALIZACI:
        update_data = child_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_child, key, value)
        
        # Pro jistotu pojistíme majitele i při updatu
        if x_user_id:
            db_child.user_id = x_user_id
            
        session.add(db_child)

    session.commit()
    session.refresh(db_child)
    return db_child


@router.delete("/children/{child_id}")
def delete_child(child_id: str, session: Session = Depends(get_session), x_user_id: str = Header(None)):
    verify_child_ownership(session, child_id, x_user_id)
    ok = cc.delete_child(session, child_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"status": "deleted", "child_id": child_id}