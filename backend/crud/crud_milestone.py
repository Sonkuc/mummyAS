from sqlmodel import Session, select
from typing import List, Optional
from ..models import Milestone, MilestoneCreate, MilestoneUpdate

# ============ MILESTONE CRUD OPERATIONS ============

def create_milestone(
    session: Session,
    child_id: str,
    data: MilestoneCreate
):
    """Vytvoří nový milník a propojí ho s child_id."""
    rec = Milestone(
        **data.dict(),
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def get_milestone(session: Session, milestone_id: str) -> Optional[Milestone]:
    """Získá jeden milník podle jeho primárního UUID id."""
    return session.get(Milestone, milestone_id)

def get_milestones_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[Milestone]:
    """Vrátí všechny milníky pro dané dítě. Seřazení si řeší frontend."""
    query = select(Milestone).where(Milestone.child_id == child_id)
    if date:
        query = query.where(Milestone.date == date)
    return session.exec(query).all()

def update_milestone(session: Session, milestone: Milestone, milestone_data: MilestoneUpdate) -> Optional[Milestone]:
    """
    Aktualizuje existující objekt milníku. 
    Router nejdříve milník najde pomocí get_milestone a pak ho předá sem.
    """
    update_dict = milestone_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(milestone, key, value)

    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return milestone

def delete_milestone(session: Session, milestone_id: str) -> bool:
    """Smaže milník podle jeho primárního UUID id."""
    milestone = session.get(Milestone, milestone_id)
    if not milestone:
        return False
    session.delete(milestone)
    session.commit()
    return True

def find_milestones_by_date(session: Session, child_id: str, date: str) -> List[Milestone]:
    """Pomocná funkce pro vyhledání milníků v konkrétní den (např. pro validaci duplicit)."""
    return session.exec(
        select(Milestone).where(Milestone.child_id == child_id, Milestone.date == date)
    ).all()