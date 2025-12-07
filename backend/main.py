from fastapi import FastAPI, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional

from models import (
    Child, ChildCreate, ChildUpdate,
    Milestone, MilestoneCreate, MilestoneUpdate,
    WeightHeight, WeightHeightCreate, WeightHeightUpdate,
    BreastfeedingRecord, BreastfeedingRecordCreate, BreastfeedingRecordUpdate,
    SleepRecord, SleepRecordCreate, SleepRecordUpdate,
    WordEntry, WordEntryCreate, WordEntryUpdate,
    TeethRecord, TeethRecordCreate, TeethRecordUpdate,
    FoodRecord, FoodRecordCreate, FoodRecordUpdate,
)
from db import init_db, get_session

app = FastAPI(title="MummyAS API", version="1.0.0")

@app.on_event("startup")
def on_startup():
    init_db()

# ============ CHILD ENDPOINTS ============

@app.get("/children", response_model=List[Child])
def get_children(session: Session = Depends(get_session)):
    """Get all children."""
    return session.exec(select(Child)).all()

@app.get("/children/{child_id}", response_model=Child)
def get_child(child_id: str, session: Session = Depends(get_session)):
    """Get a specific child by ID."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child

@app.post("/children", response_model=Child)
def create_child(child_data: ChildCreate, session: Session = Depends(get_session)):
    """Create a new child."""
    child = Child(**child_data.dict())
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

@app.put("/children/{child_id}", response_model=Child)
def update_child(child_id: str, child_data: ChildUpdate, session: Session = Depends(get_session)):
    """Update a child's information."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    child_dict = child_data.dict(exclude_unset=True)
    for key, value in child_dict.items():
        setattr(child, key, value)
    
    session.add(child)
    session.commit()
    session.refresh(child)
    return child

@app.delete("/children/{child_id}")
def delete_child(child_id: str, session: Session = Depends(get_session)):
    """Delete a child and all associated data."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    session.delete(child)
    session.commit()
    return {"status": "deleted", "child_id": child_id}

# ============ MILESTONE ENDPOINTS ============

@app.get("/children/{child_id}/milestones", response_model=List[Milestone])
def get_milestones(child_id: str, session: Session = Depends(get_session)):
    """Get all milestones for a child."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return session.exec(select(Milestone).where(Milestone.child_id == child_id)).all()

@app.post("/children/{child_id}/milestones", response_model=Milestone)
def create_milestone(child_id: str, milestone_data: MilestoneCreate, session: Session = Depends(get_session)):
    """Create a new milestone for a child."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    milestone = Milestone(**milestone_data.dict())
    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return milestone

@app.put("/children/{child_id}/milestones/{milestone_id}", response_model=Milestone)
def update_milestone(child_id: str, milestone_id: str, milestone_data: MilestoneUpdate, session: Session = Depends(get_session)):
    """Update a milestone."""
    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    milestone_dict = milestone_data.dict(exclude_unset=True)
    for key, value in milestone_dict.items():
        setattr(milestone, key, value)
    
    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return milestone

@app.delete("/children/{child_id}/milestones/{milestone_id}")
def delete_milestone(child_id: str, milestone_id: str, session: Session = Depends(get_session)):
    """Delete a milestone."""
    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.child_id != child_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    session.delete(milestone)
    session.commit()
    return {"status": "deleted", "milestone_id": milestone_id}

# ============ WEIGHT/HEIGHT ENDPOINTS ============

@app.get("/children/{child_id}/weight-height", response_model=List[WeightHeight])
def get_weight_height_records(child_id: str, session: Session = Depends(get_session)):
    """Get all weight/height records for a child."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return session.exec(select(WeightHeight).where(WeightHeight.child_id == child_id)).all()

@app.post("/children/{child_id}/weight-height", response_model=WeightHeight)
def create_weight_height(child_id: str, wh_data: WeightHeightCreate, session: Session = Depends(get_session)):
    """Create a new weight/height record."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    wh = WeightHeight(**wh_data.dict())
    session.add(wh)
    session.commit()
    session.refresh(wh)
    return wh

@app.put("/children/{child_id}/weight-height/{wh_id}", response_model=WeightHeight)
def update_weight_height(child_id: str, wh_id: str, wh_data: WeightHeightUpdate, session: Session = Depends(get_session)):
    """Update a weight/height record."""
    wh = session.get(WeightHeight, wh_id)
    if not wh or wh.child_id != child_id:
        raise HTTPException(status_code=404, detail="Weight/height record not found")
    
    wh_dict = wh_data.dict(exclude_unset=True)
    for key, value in wh_dict.items():
        setattr(wh, key, value)
    
    session.add(wh)
    session.commit()
    session.refresh(wh)
    return wh

@app.delete("/children/{child_id}/weight-height/{wh_id}")
def delete_weight_height(child_id: str, wh_id: str, session: Session = Depends(get_session)):
    """Delete a weight/height record."""
    wh = session.get(WeightHeight, wh_id)
    if not wh or wh.child_id != child_id:
        raise HTTPException(status_code=404, detail="Weight/height record not found")
    
    session.delete(wh)
    session.commit()
    return {"status": "deleted", "wh_id": wh_id}

# ============ BREASTFEEDING ENDPOINTS ============

@app.get("/children/{child_id}/breastfeeding", response_model=List[BreastfeedingRecord])
def get_breastfeeding_records(child_id: str, date: Optional[str] = Query(None), session: Session = Depends(get_session)):
    """Get breastfeeding records for a child. Optionally filter by date (YYYY-MM-DD)."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    query = select(BreastfeedingRecord).where(BreastfeedingRecord.child_id == child_id)
    if date:
        query = query.where(BreastfeedingRecord.date == date)
    
    return session.exec(query).all()

@app.post("/children/{child_id}/breastfeeding", response_model=BreastfeedingRecord)
def create_breastfeeding_record(child_id: str, bf_data: BreastfeedingRecordCreate, session: Session = Depends(get_session)):
    """Create a new breastfeeding record."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    bf = BreastfeedingRecord(**bf_data.dict())
    session.add(bf)
    session.commit()
    session.refresh(bf)
    return bf

@app.put("/children/{child_id}/breastfeeding/{bf_id}", response_model=BreastfeedingRecord)
def update_breastfeeding_record(child_id: str, bf_id: str, bf_data: BreastfeedingRecordUpdate, session: Session = Depends(get_session)):
    """Update a breastfeeding record."""
    bf = session.get(BreastfeedingRecord, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    
    bf_dict = bf_data.dict(exclude_unset=True)
    for key, value in bf_dict.items():
        setattr(bf, key, value)
    
    session.add(bf)
    session.commit()
    session.refresh(bf)
    return bf

@app.delete("/children/{child_id}/breastfeeding/{bf_id}")
def delete_breastfeeding_record(child_id: str, bf_id: str, session: Session = Depends(get_session)):
    """Delete a breastfeeding record."""
    bf = session.get(BreastfeedingRecord, bf_id)
    if not bf or bf.child_id != child_id:
        raise HTTPException(status_code=404, detail="Breastfeeding record not found")
    
    session.delete(bf)
    session.commit()
    return {"status": "deleted", "bf_id": bf_id}

# ============ SLEEP ENDPOINTS ============

@app.get("/children/{child_id}/sleep", response_model=List[SleepRecord])
def get_sleep_records(child_id: str, date: Optional[str] = Query(None), session: Session = Depends(get_session)):
    """Get sleep records for a child. Optionally filter by date (YYYY-MM-DD)."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    query = select(SleepRecord).where(SleepRecord.child_id == child_id)
    if date:
        query = query.where(SleepRecord.date == date)
    
    return session.exec(query).all()

@app.post("/children/{child_id}/sleep", response_model=SleepRecord)
def create_sleep_record(child_id: str, sleep_data: SleepRecordCreate, session: Session = Depends(get_session)):
    """Create a new sleep record."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    sleep = SleepRecord(**sleep_data.dict())
    session.add(sleep)
    session.commit()
    session.refresh(sleep)
    return sleep

@app.put("/children/{child_id}/sleep/{sleep_id}", response_model=SleepRecord)
def update_sleep_record(child_id: str, sleep_id: str, sleep_data: SleepRecordUpdate, session: Session = Depends(get_session)):
    """Update a sleep record."""
    sleep = session.get(SleepRecord, sleep_id)
    if not sleep or sleep.child_id != child_id:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    
    sleep_dict = sleep_data.dict(exclude_unset=True)
    for key, value in sleep_dict.items():
        setattr(sleep, key, value)
    
    session.add(sleep)
    session.commit()
    session.refresh(sleep)
    return sleep

@app.delete("/children/{child_id}/sleep/{sleep_id}")
def delete_sleep_record(child_id: str, sleep_id: str, session: Session = Depends(get_session)):
    """Delete a sleep record."""
    sleep = session.get(SleepRecord, sleep_id)
    if not sleep or sleep.child_id != child_id:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    
    session.delete(sleep)
    session.commit()
    return {"status": "deleted", "sleep_id": sleep_id}

# ============ WORD (SPEAKING) ENDPOINTS ============

@app.get("/children/{child_id}/words", response_model=List[WordEntry])
def get_words(child_id: str, session: Session = Depends(get_session)):
    """Get all words/speaking entries for a child."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return session.exec(select(WordEntry).where(WordEntry.child_id == child_id)).all()

@app.post("/children/{child_id}/words", response_model=WordEntry)
def create_word(child_id: str, word_data: WordEntryCreate, session: Session = Depends(get_session)):
    """Create a new word entry."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    word = WordEntry(**word_data.dict())
    session.add(word)
    session.commit()
    session.refresh(word)
    return word

@app.put("/children/{child_id}/words/{word_id}", response_model=WordEntry)
def update_word(child_id: str, word_id: str, word_data: WordEntryUpdate, session: Session = Depends(get_session)):
    """Update a word entry."""
    word = session.get(WordEntry, word_id)
    if not word or word.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word entry not found")
    
    word_dict = word_data.dict(exclude_unset=True)
    for key, value in word_dict.items():
        setattr(word, key, value)
    
    session.add(word)
    session.commit()
    session.refresh(word)
    return word

@app.delete("/children/{child_id}/words/{word_id}")
def delete_word(child_id: str, word_id: str, session: Session = Depends(get_session)):
    """Delete a word entry."""
    word = session.get(WordEntry, word_id)
    if not word or word.child_id != child_id:
        raise HTTPException(status_code=404, detail="Word entry not found")
    
    session.delete(word)
    session.commit()
    return {"status": "deleted", "word_id": word_id}

# ============ TEETH ENDPOINTS ============

@app.get("/children/{child_id}/teeth", response_model=List[TeethRecord])
def get_teeth_records(child_id: str, session: Session = Depends(get_session)):
    """Get all teeth records for a child."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return session.exec(select(TeethRecord).where(TeethRecord.child_id == child_id)).all()

@app.post("/children/{child_id}/teeth", response_model=TeethRecord)
def create_teeth_record(child_id: str, teeth_data: TeethRecordCreate, session: Session = Depends(get_session)):
    """Create a new teeth record."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    teeth = TeethRecord(**teeth_data.dict())
    session.add(teeth)
    session.commit()
    session.refresh(teeth)
    return teeth

@app.put("/children/{child_id}/teeth/{teeth_id}", response_model=TeethRecord)
def update_teeth_record(child_id: str, teeth_id: str, teeth_data: TeethRecordUpdate, session: Session = Depends(get_session)):
    """Update a teeth record."""
    teeth = session.get(TeethRecord, teeth_id)
    if not teeth or teeth.child_id != child_id:
        raise HTTPException(status_code=404, detail="Teeth record not found")
    
    teeth_dict = teeth_data.dict(exclude_unset=True)
    for key, value in teeth_dict.items():
        setattr(teeth, key, value)
    
    session.add(teeth)
    session.commit()
    session.refresh(teeth)
    return teeth

@app.delete("/children/{child_id}/teeth/{teeth_id}")
def delete_teeth_record(child_id: str, teeth_id: str, session: Session = Depends(get_session)):
    """Delete a teeth record."""
    teeth = session.get(TeethRecord, teeth_id)
    if not teeth or teeth.child_id != child_id:
        raise HTTPException(status_code=404, detail="Teeth record not found")
    
    session.delete(teeth)
    session.commit()
    return {"status": "deleted", "teeth_id": teeth_id}

# ============ FOOD ENDPOINTS ============

@app.get("/children/{child_id}/food", response_model=List[FoodRecord])
def get_food_records(child_id: str, date: Optional[str] = Query(None), category: Optional[str] = Query(None), session: Session = Depends(get_session)):
    """Get food records for a child. Optionally filter by date (YYYY-MM-DD) and/or category."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    query = select(FoodRecord).where(FoodRecord.child_id == child_id)
    if date:
        query = query.where(FoodRecord.date == date)
    if category:
        query = query.where(FoodRecord.category == category)
    
    return session.exec(query).all()

@app.post("/children/{child_id}/food", response_model=FoodRecord)
def create_food_record(child_id: str, food_data: FoodRecordCreate, session: Session = Depends(get_session)):
    """Create a new food record."""
    child = session.get(Child, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    food = FoodRecord(**food_data.dict())
    session.add(food)
    session.commit()
    session.refresh(food)
    return food

@app.put("/children/{child_id}/food/{food_id}", response_model=FoodRecord)
def update_food_record(child_id: str, food_id: str, food_data: FoodRecordUpdate, session: Session = Depends(get_session)):
    """Update a food record."""
    food = session.get(FoodRecord, food_id)
    if not food or food.child_id != child_id:
        raise HTTPException(status_code=404, detail="Food record not found")
    
    food_dict = food_data.dict(exclude_unset=True)
    for key, value in food_dict.items():
        setattr(food, key, value)
    
    session.add(food)
    session.commit()
    session.refresh(food)
    return food

@app.delete("/children/{child_id}/food/{food_id}")
def delete_food_record(child_id: str, food_id: str, session: Session = Depends(get_session)):
    """Delete a food record."""
    food = session.get(FoodRecord, food_id)
    if not food or food.child_id != child_id:
        raise HTTPException(status_code=404, detail="Food record not found")
    
    session.delete(food)
    session.commit()
    return {"status": "deleted", "food_id": food_id}

# ============ HEALTH CHECK ============

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}