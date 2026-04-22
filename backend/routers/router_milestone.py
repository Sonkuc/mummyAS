from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session
from ..crud import crud_milestone as cm
from ..models import Child, Milestone, MilestoneCreate, MilestoneUpdate, MilestoneRead
from ..db import get_session

router = APIRouter()

def verify_child_ownership(session: Session, child_id: str, x_user_id: str):
    """Pomocná funkce pro ověření, zda dítě patří danému uživateli."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing")
    
    child = session.get(Child, child_id)
    if not child or child.user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Tohle dítě vám nepatří!")
    return child

@router.get("/children/{child_id}/milestones", response_model=List[MilestoneRead])
def list_milestones(
    child_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Získání všech milníků dítěte s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cm.get_milestones_for_child(session, child_id)

@router.post("/children/{child_id}/milestones", response_model=MilestoneRead)
def create_milestone(
    child_id: str,
    milestone_data: MilestoneCreate,
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Vytvoření milníku s ověřením, že uživatel vlastní dané dítě."""
    verify_child_ownership(session, child_id, x_user_id)
    return cm.create_milestone(session, child_id, milestone_data)

@router.get("/children/{child_id}/milestones/{milestone_id}", response_model=MilestoneRead)
def get_milestone(
    child_id: str, 
    milestone_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Detail milníku s dvojitou kontrolou (vlastník i příslušnost k dítěti)."""
    verify_child_ownership(session, child_id, x_user_id)
    
    milestone = cm.get_milestone(session, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return milestone

@router.put("/children/{child_id}/milestones/{milestone_id}", response_model=MilestoneRead)
def update_milestone(
    child_id: str, 
    milestone_id: str, 
    milestone_data: MilestoneUpdate, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Aktualizace milníku s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    
    milestone = cm.get_milestone(session, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    updated = cm.update_milestone(session, milestone, milestone_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated

@router.delete("/children/{child_id}/milestones/{milestone_id}")
def delete_milestone(
    child_id: str, 
    milestone_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(None)
):
    """Smazání milníku s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    
    milestone = cm.get_milestone(session, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    cm.delete_milestone(session, milestone_id)
    return {"status": "deleted", "milestone_id": milestone_id}