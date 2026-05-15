from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlmodel import Session

from ..crud import crud_milestone as cm
from ..models import Child, MilestoneCreate, MilestoneUpdate, MilestoneRead
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

@router.get("/children/{child_id}/milestones", response_model=List[MilestoneRead])
def list_milestones(
    child_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    """Seznam milníků dítěte s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    return cm.get_milestones_for_child(session, child_id)

@router.post("/children/{child_id}/milestones", response_model=MilestoneRead)
def create_milestone(
    child_id: str,
    milestone_data: MilestoneCreate,
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Vytvoření nového milníku s kontrolou hierarchie."""
    verify_child_ownership(session, child_id, x_user_id)
    return cm.create_milestone(session, child_id, milestone_data)

@router.get("/children/{child_id}/milestones/{milestone_id}", response_model=MilestoneRead)
def get_milestone(
    child_id: str, 
    milestone_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    """Detail milníku s kontrolou integrity (patří dítěti i uživateli)."""
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
    x_user_id: str = Header(...)
):
    """Aktualizace milníku s ověřením vlastníka a vazby na dítě."""
    verify_child_ownership(session, child_id, x_user_id)
    
    milestone = cm.get_milestone(session, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    return cm.update_milestone(session, milestone, milestone_data)

@router.delete("/children/{child_id}/milestones/{milestone_id}")
def delete_milestone(
    child_id: str, 
    milestone_id: str, 
    session: Session = Depends(get_session), 
    x_user_id: str = Header(...)
):
    """Smazání milníku s ověřením vlastníka."""
    verify_child_ownership(session, child_id, x_user_id)
    
    milestone = cm.get_milestone(session, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    cm.delete_milestone(session, milestone_id)
    return {"status": "deleted", "milestone_id": milestone_id}
