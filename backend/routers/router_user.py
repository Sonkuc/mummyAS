from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session
from ..db import get_session
from ..models import UserProfile
from ..crud import crud_user as cu # Importujeme náš CRUD

router = APIRouter()

def ensure_profile(
    profile_data: UserProfile, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Zajistí existenci profilu po přihlášení."""
    if profile_data.id != x_user_id:
        raise HTTPException(status_code=403, detail="Nemůžete vytvářet profil pro jiné ID")
    return cu.ensure_user_profile(session, profile_data)

@router.get("/profiles/{user_id}")
def get_profile(
    user_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Načte profil přihlášeného uživatele."""
    if user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Můžete prohlížet pouze svůj vlastní profil")

    db_profile = cu.get_user_profile(session, user_id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profil nenalezen")
    return db_profile

@router.put("/profiles/{user_id}")
def update_profile(
    user_id: str, 
    profile_data: UserProfile, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Aktualizuje data v profilu."""
    if user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Můžete upravovat pouze svůj vlastní profil")

    updated_profile = cu.update_user_profile(session, user_id, profile_data)
    if not updated_profile:
        raise HTTPException(status_code=404, detail="Profil nenalezen")
    return updated_profile

@router.delete("/profiles/{user_id}")
def delete_profile(
    user_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(...)
):
    """Smaže profil uživatele."""
    if user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Můžete smazat pouze svůj vlastní profil")

    success = cu.delete_user_profile(session, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Profil nenalezen")
    
    return {"status": "deleted", "user_id": user_id}