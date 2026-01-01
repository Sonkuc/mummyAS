from sqlmodel import SQLModel, Field
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

    milestones: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSON))
    words: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSON))
    teethDates: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSON))
    wh: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSON))
    foodDates: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSON))
    foodCategories: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSON))

class ChildRead(ChildBase):
    id: str

class Child(ChildBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)

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

class BreastfeedingRecordCreate(BreastfeedingRecordBase):
    pass

class BreastfeedingRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[BreastfeedingState] = None

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

class SleepRecordCreate(SleepRecordBase):
    pass

class SleepRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[SleepState] = None
    label: Optional[str] = None
    extra: Optional[str] = None

# ============ SPEAKING (WORD) MODELS ============

class SpeakingBase(SQLModel):
    name: str  # The word itself
    date: str  # YYYY-MM-DD format
    note: Optional[str] = None

class SpeakingRead(SpeakingBase):
    id: str
    child_id: str
    created_at: datetime

class Speaking(SpeakingBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SpeakingCreate(SpeakingBase):
    pass

class SpeakingUpdate(SQLModel):
    date: Optional[str] = None
    note: Optional[str] = None

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
    category: FoodCategory  # "cereal", "fruit", "vegetable", "meat", "legume", "herbs", "other"
    food_name: str
    date: str  # YYYY-MM-DD format

class FoodRecordRead(FoodRecordBase):
    id: str
    child_id: str
    created_at: datetime

class FoodRecord(FoodRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="child.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FoodRecordCreate(FoodRecordBase):
    pass

class FoodRecordUpdate(SQLModel):
    food_name: Optional[str] = None
    date: Optional[str] = None
    category: Optional[FoodCategory] = None