from sqlmodel import Session, select
from typing import List
from ..models import WeightHeight

def get_wh_for_child(session: Session, child_id: str) -> List[WeightHeight]:
    """Vrátí všechny záznamy váhy a výšky pro dané dítě."""
    return session.exec(
        select(WeightHeight).where(WeightHeight.child_id == child_id)
    ).all()