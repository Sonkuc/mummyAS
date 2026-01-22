from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..crud import crud_milestone as cm
from ..models import MilestoneCreate, MilestoneUpdate, MilestoneRead
from ..db import get_session

router = APIRouter()


@router.get("/children/{child_id}/milestones", response_model=List[MilestoneRead])
def list_milestones(child_id: str, session: Session = Depends(get_session)):
    """
    List all milestones for a child.
    """
    return cm.get_milestones_for_child(session, child_id)

@router.post(
    "/children/{child_id}/milestones",
    response_model=MilestoneRead
)
def create_milestone(
    child_id: str,
    milestone_data: MilestoneCreate,
    session: Session = Depends(get_session)
):
    return cm.create_milestone(session, child_id, milestone_data)

@router.get("/children/{child_id}/milestones/{milestone_id}", response_model=MilestoneRead)
def get_milestone(child_id: str, milestone_id: str, session: Session = Depends(get_session)):
    """
    Get a single milestone by `milestone_id`. Verifies the milestone belongs to `child_id`.
    """
    milestone = cm.get_milestone(session, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return milestone


@router.put("/children/{child_id}/milestones/{milestone_id}", response_model=MilestoneRead)
def update_milestone(child_id: str, milestone_id: str, milestone_data: MilestoneUpdate, session: Session = Depends(get_session)):
    """
    Update a milestone. Partial updates supported (only changed fields required).
    """
    milestone = cm.get_milestone(session, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    updated = cm.update_milestone(session, milestone, milestone_data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Update failed")
    return updated


@router.delete("/children/{child_id}/milestones/{milestone_id}")
def delete_milestone(child_id: str, milestone_id: str, session: Session = Depends(get_session)):
    """
    Delete a milestone by `milestone_id`. Verifies the milestone belongs to `child_id`.
    """
    milestone = cm.get_milestone(session, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    cm.delete_milestone(session, milestone_id)
    return {"status": "deleted", "milestone_id": milestone_id}