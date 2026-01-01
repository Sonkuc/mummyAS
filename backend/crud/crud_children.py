from sqlmodel import Session, select
from typing import List, Optional
from ..models import Child, ChildCreate, ChildUpdate

# ============ CHILD CRUD OPERATIONS ============

def create_child(session: Session, child_data: ChildCreate) -> Child:
    """Create a new child record. Accepts full child shape (including nested fields)."""
    child = Child(**child_data.dict())
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

def get_child(session: Session, child_id: str) -> Optional[Child]:
    """Get a specific child by ID."""
    return session.get(Child, child_id)

def get_all_children(session: Session) -> List[Child]:
    """Get all children."""
    return session.exec(select(Child)).all()

def update_child(session: Session, child_id: str, child_data: ChildUpdate) -> Optional[Child]:
    """Update a child's information (partial update supported)."""
    child = session.get(Child, child_id)
    if not child:
        return None

    update_dict = child_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(child, key, value)

    session.add(child)
    session.commit()
    session.refresh(child)
    return child

def delete_child(session: Session, child_id: str) -> bool:
    """Delete a child."""
    child = session.get(Child, child_id)
    if not child:
        return False

    session.delete(child)
    session.commit()
    return True

def search_children(session: Session, name: Optional[str] = None) -> List[Child]:
    """Search children by name (case-insensitive contains)."""
    query = select(Child)
    if name:
        query = query.where(Child.name.contains(name))
    return session.exec(query).all()