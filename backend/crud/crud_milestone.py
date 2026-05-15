from sqlmodel import Session, select
from typing import List, Optional
from ..models import Milestone, MilestoneCreate, MilestoneUpdate


def create_milestone(session: Session, child_id: str, data: MilestoneCreate) -> Milestone:
    """Vytvoří nový milník a propojí ho s child_id."""
    rec = Milestone(
        **data.model_dump(),
        child_id=child_id
    )
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def get_milestone(session: Session, milestone_id: str) -> Optional[Milestone]:
    """Získá milník podle primárního UUID id."""
    return session.get(Milestone, milestone_id)

def get_milestones_for_child(session: Session, child_id: str, date: Optional[str] = None) -> List[Milestone]:
    """Vrátí všechny milníky pro dané dítě (volitelně filtrované datem)."""
    query = select(Milestone).where(Milestone.child_id == child_id)
    if date:
        query = query.where(Milestone.date == date)
    return session.exec(query).all()

def update_milestone(session: Session, milestone: Milestone, milestone_data: MilestoneUpdate) -> Optional[Milestone]:
    """Aktualizuje existující objekt milníku v databázi."""
    update_dict = milestone_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(milestone, key, value)

    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return milestone

def delete_milestone(session: Session, milestone: Milestone) -> None:
    """Smaže předaný objekt milníku z databáze."""
    session.delete(milestone)
    session.commit()