from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session
from ..models import UserProfile
from ..db import get_session

router = APIRouter()

@router.post("/profiles")
def ensure_profile(
    profile_data: UserProfile, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None) 
):
    if x_user_id and profile_data.id != x_user_id:
        raise HTTPException(status_code=403, detail="Nemůžete vytvářet profil pro jiné ID")

    db_profile = session.get(UserProfile, profile_data.id)
    
    if not db_profile:
        print(f"DEBUG: Vytvářím úplně nový profil pro ID: {profile_data.id}")
        new_profile = UserProfile(
            id=profile_data.id,
            email=profile_data.email,
            gender=profile_data.gender
        )
        session.add(new_profile)
    else:
        print(f"DEBUG: Profil {profile_data.id} nalezen, aktualizuji email.")
        db_profile.email = profile_data.email
        session.add(db_profile)
    
    session.commit()
    return {"status": "success"}

@router.put("/profiles/{user_id}")
def update_profile(
    user_id: str, 
    profile_data: dict, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None) # Přidáno
):
    if user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Můžete upravovat pouze svůj vlastní profil")

    db_profile = session.get(UserProfile, user_id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for key, value in profile_data.items():
        # ID profilu by se nikdy nemělo měnit přes PUT
        if key != "id":
            setattr(db_profile, key, value)
    
    session.add(db_profile)
    session.commit()
    session.refresh(db_profile)
    return db_profile

@router.get("/profiles/{user_id}")
def get_profile(
    user_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    """Nové: Endpoint pro načtení vlastního profilu."""
    if user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Můžete prohlížet pouze svůj vlastní profil")

    db_profile = session.get(UserProfile, user_id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profil nenalezen")
    return db_profile

@router.delete("/profiles/{user_id}")
def delete_profile(
    user_id: str, 
    session: Session = Depends(get_session),
    x_user_id: str = Header(None)
):
    # Hierarchická kontrola
    if user_id != x_user_id:
        raise HTTPException(status_code=403, detail="Můžete smazat pouze svůj vlastní profil")

    db_profile = session.get(UserProfile, user_id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profil nenalezen")
    
    session.delete(db_profile)
    session.commit()
    return {"status": "deleted"}