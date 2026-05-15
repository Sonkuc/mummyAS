from typing import Optional
from sqlmodel import Session, select
from ..models import UserProfile

from typing import Optional, Dict, Any
from sqlmodel import Session
from ..models import UserProfile

def get_user_profile(session: Session, user_id: str) -> Optional[UserProfile]:
    """Získá profil uživatele podle jeho ID."""
    return session.get(UserProfile, user_id)

def ensure_user_profile(session: Session, profile_data: UserProfile) -> UserProfile:
    """Vytvoří nový profil nebo aktualizuje existující (Upsert logika)."""
    db_profile = session.get(UserProfile, profile_data.id)
    
    if not db_profile:
        # Vytvoření úplně nového profilu
        session.add(profile_data)
        db_profile = profile_data
    else:
        # Aktualizace stávajícího (např. emailu při novém přihlášení)
        db_profile.email = profile_data.email
        if profile_data.gender:
            db_profile.gender = profile_data.gender
        session.add(db_profile)
    
    session.commit()
    session.refresh(db_profile)
    return db_profile

def update_user_profile(session: Session, user_id: str, update_data: Dict[str, Any]) -> Optional[UserProfile]:
    """Aktualizuje vybraná pole profilu uživatele."""
    db_profile = session.get(UserProfile, user_id)
    if not db_profile:
        return None
        
    for key, value in update_data.items():
        if key != "id":  # ID je primární klíč, neměnit!
            setattr(db_profile, key, value)
            
    session.add(db_profile)
    session.commit()
    session.refresh(db_profile)
    return db_profile

def delete_user_profile(session: Session, user_id: str) -> bool:
    """Smaže profil uživatele z databáze."""
    db_profile = session.get(UserProfile, user_id)
    if not db_profile:
        return False
        
    session.delete(db_profile)
    session.commit()
    return True