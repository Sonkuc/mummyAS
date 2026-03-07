from sqlmodel import Session, select
from typing import List, Optional

from ..models import WeightHeight, WeightHeightCreate, WeightHeightUpdate

# ============ WEIGHT / HEIGHT CRUD OPERATIONS ============

def get_wh_for_child(session: Session, child_id: str):
    """Vrátí všechny záznamy váhy a výšky pro dané dítě."""
    return session.exec(select(WeightHeight).where(WeightHeight.child_id == child_id)).all()

def create_wh(session: Session, child_id: str, data: WeightHeightCreate) -> WeightHeight:
    rec = WeightHeight(**data.dict(), child_id=child_id)
    session.add(rec)
    session.commit()
    session.refresh(rec)
    return rec

def update_wh(session: Session, wh_rec: WeightHeight, data: WeightHeightUpdate) -> WeightHeight:
    update_dict = data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(wh_rec, key, value)
    session.add(wh_rec)
    session.commit()
    session.refresh(wh_rec)
    return wh_rec

def delete_wh_record(session: Session, wh_id: str, child_id: str) -> bool:
    rec = session.get(WeightHeight, wh_id)
    if not rec or rec.child_id != child_id:
        return False
    session.delete(rec)
    session.commit()
    return True