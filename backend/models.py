from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime
from sqlalchemy import Column, JSON
from enum import Enum

# ============ CHILD MODELS ============

class ChildBase(SQLModel):
    name: str
    birthDate: str
    sex: str
    photo: Optional[str] = None
    currentModeFeed: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    currentModeSleep: Optional[dict] = Field(default=None, sa_column=Column(JSON))

class ChildRead(ChildBase):
    id: str
    milestones: List["MilestoneRead"] = Field(default_factory=list) 
    teethRecords: List["TeethRecordRead"] = Field(default_factory=list)
    words: List["SpeakingRead"] = Field(default_factory=list)
    wh: List["WeightHeightRead"] = Field(default_factory=list)
    foodRecords: List["FoodRecordRead"] = Field(default_factory=list)
    sleepRecords: List["SleepRecordRead"] = Field(default_factory=list)
    breastfeedingRecords: List["BreastfeedingRecordRead"] = Field(default_factory=list)   

class Child(ChildBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    
    milestones: List["Milestone"] = Relationship(back_populates="child")
    teethRecords: List["TeethRecord"] = Relationship(back_populates="child")
    words: List["Speaking"] = Relationship(back_populates="child")
    wh: List["WeightHeight"] = Relationship(back_populates="child")
    foodRecords: List["FoodRecord"] = Relationship(back_populates="child")
    sleepRecords: List["SleepRecord"] = Relationship(back_populates="child")
    breastfeedingRecords: List["BreastfeedingRecord"] = Relationship(back_populates="child")    

class ChildCreate(SQLModel):
    name: str
    birthDate: str
    sex: str
    photo: Optional[str] = None

class ChildUpdate(SQLModel):
    name: Optional[str] = None
    birthDate: Optional[str] = None
    sex: Optional[str] = None
    photo: Optional[str] = None
    currentModeFeed: Optional[dict] = None
    currentModeSleep: Optional[dict] = None

# ============ MILESTONE MODELS ============

class MilestoneBase(SQLModel):
    name: str
    date: str  # YYYY-MM-DD
    note: Optional[str] = None

class MilestoneRead(MilestoneBase):
    id: str
    child_id: str
    created_at: datetime

class Milestone(MilestoneBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    child: "Child" = Relationship(back_populates="milestones")

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(SQLModel):
    name: Optional[str] = None
    date: Optional[str] = None
    note: Optional[str] = None

# ============ WEIGHT/HEIGHT MODELS ============

class WeightHeightBase(SQLModel):
    date: str  # YYYY-MM-DD format
    weight: Optional[float] = None  # in kg
    height: Optional[float] = None  # in cm
    head: Optional[float] = None  # in cm
    foot: Optional[str] = None
    clothes: Optional[str] = None

class WeightHeightRead(WeightHeightBase):
    id: str
    child_id: str
    created_at: datetime

class WeightHeight(WeightHeightBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    child: "Child" = Relationship(back_populates="wh")

class WeightHeightCreate(WeightHeightBase):
    pass

class WeightHeightUpdate(SQLModel):
    date: Optional[str] = None  # YYYY-MM-DD format
    weight: Optional[float] = None
    height: Optional[float] = None
    head: Optional[float] = None
    foot: Optional[str] = None
    clothes: Optional[str] = None

# ============ BREASTFEEDING MODELS ============
class BreastfeedingState(str, Enum):
    start = "start"
    stop = "stop"

class BreastfeedingRecordBase(SQLModel):
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM format
    state: BreastfeedingState  # "start" or "stop"

class BreastfeedingRecordRead(BreastfeedingRecordBase):
    id: str
    child_id: str
    created_at: datetime

class BreastfeedingRecord(BreastfeedingRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    child: "Child" = Relationship(back_populates="breastfeedingRecords")

class BreastfeedingRecordCreate(BreastfeedingRecordBase):
    pass

class BreastfeedingRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[BreastfeedingState] = None

class BreastfeedingDaySummary(SQLModel):
    date: str
    total_minutes: int

# ============ SLEEP MODELS ============

class SleepState(str, Enum):
    sleep = "sleep"
    awake = "awake"

class SleepRecordBase(SQLModel):
    date: str           # YYYY-MM-DD
    time: str           # HH:MM
    state: SleepState  # "sleep" or "awake"
    label: Optional[str] = None
    extra: Optional[str] = None

class SleepRecordRead(SleepRecordBase):
    id: str
    child_id: str
    created_at: datetime

class SleepRecord(SleepRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    child: "Child" = Relationship(back_populates="sleepRecords")

class SleepRecordCreate(SleepRecordBase):
    pass

class SleepRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[SleepState] = None
    label: Optional[str] = None
    extra: Optional[str] = None

class SleepDaySummary(SQLModel):
    date: str
    total_minutes: int

# --- ENTRY MODEL (Historie výslovnosti) ---
class WordEntryBase(SQLModel):
    date: str  # YYYY-MM-DD
    note: Optional[str] = None

class WordEntry(WordEntryBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    word_id: str = Field(foreign_key="speaking.id", ondelete="CASCADE")
    
    # Relace zpět na hlavní slovo
    word: "Speaking" = Relationship(back_populates="entries")

class WordEntryUpdate(SQLModel):
    date: Optional[str] = None
    note: Optional[str] = None

# --- MAIN WORD MODEL (Hlavní slovo) ---
class SpeakingBase(SQLModel):
    name: str  # Např. "Ahoj"

class Speaking(SpeakingBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relace na historii výslovností
    entries: List[WordEntry] = Relationship(back_populates="word", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    child: "Child" = Relationship(back_populates="words")

# --- SCHÉMATA PRO API (Pydantic / SQLModel) ---
class WordEntryCreate(WordEntryBase):
    pass

class SpeakingCreate(SpeakingBase):
    # Při vytváření slova rovnou vytvoříme i první záznam
    entries: List[WordEntryCreate] = []

class SpeakingUpdate(SQLModel):
    name: Optional[str] = None
    entries: Optional[List[WordEntryCreate]] = None

class SpeakingRead(SpeakingBase):
    id: str
    child_id: str
    created_at: datetime
    entries: List[WordEntryBase] = []

# ============ TEETH MODELS ============

class TeethRecordBase(SQLModel):
    tooth_id: str  # Name/position of the tooth
    date: str  # YYYY-MM-DD format

class TeethRecordRead(TeethRecordBase):
    id: str
    child_id: str
    created_at: datetime

class TeethRecord(TeethRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    child: "Child" = Relationship(back_populates="teethRecords")

class TeethRecordCreate(TeethRecordBase):
    pass

class TeethRecordUpdate(SQLModel):
    date: Optional[str] = None

# ============ FOOD MODELS ============

class FoodCategory(str, Enum):
    cereal = "cereal"
    fruit = "fruit"
    vegetable = "vegetable"
    meat = "meat"
    legume = "legume"
    herbs = "herbs"
    other = "other"

class FoodRecordBase(SQLModel):
    category: FoodCategory # "cereal", "fruit", "vegetable", "meat", "legume", "herbs", "other"
    food_name: str
    date: Optional[str] = "" # YYYY-MM-DD format


class FoodRecordRead(FoodRecordBase):
    id: str
    child_id: str
    created_at: datetime

class FoodRecord(FoodRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    child: "Child" = Relationship(back_populates="foodRecords")

class FoodRecordCreate(FoodRecordBase):
    pass

class FoodRecordUpdate(SQLModel):
    food_name: Optional[str] = None
    date: Optional[str] = None
    category: Optional[FoodCategory] = None