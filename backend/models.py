from sqlmodel import SQLModel, Field
from typing import Optional
import uuid
from datetime import datetime

# ============ CHILD MODELS ============

class ChildBase(SQLModel):
    name: str
    birthDate: str
    sex: str
    photo: Optional[str] = None

class Child(ChildBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)

class ChildCreate(ChildBase):
    pass

class ChildUpdate(ChildBase):
    pass

# ============ MILESTONE MODELS ============

class MilestoneBase(SQLModel):
    child_id: str = Field(foreign_key="child.id")
    milId: str  # References the milestone from data/milestones.ts
    name: str
    date: str  # YYYY-MM-DD format
    note: Optional[str] = None

class Milestone(MilestoneBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(SQLModel):
    name: Optional[str] = None
    date: Optional[str] = None
    note: Optional[str] = None

# ============ WEIGHT/HEIGHT MODELS ============

class WeightHeightBase(SQLModel):
    child_id: str = Field(foreign_key="child.id")
    date: str  # YYYY-MM-DD format
    weight: Optional[float] = None  # in kg
    height: Optional[float] = None  # in cm
    head: Optional[float] = None  # in cm
    foot: Optional[str] = None
    clothes: Optional[str] = None

class WeightHeight(WeightHeightBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WeightHeightCreate(WeightHeightBase):
    pass

class WeightHeightUpdate(SQLModel):
    weight: Optional[float] = None
    height: Optional[float] = None
    head: Optional[float] = None
    foot: Optional[str] = None
    clothes: Optional[str] = None

# ============ BREASTFEEDING MODELS ============

class BreastfeedingRecordBase(SQLModel):
    child_id: str = Field(foreign_key="child.id")
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM format
    state: str  # "start" or "stop"

class BreastfeedingRecord(BreastfeedingRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BreastfeedingRecordCreate(BreastfeedingRecordBase):
    pass

class BreastfeedingRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[str] = None

# ============ SLEEP MODELS ============

class SleepRecordBase(SQLModel):
    child_id: str = Field(foreign_key="child.id")
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM format
    state: str  # "awake" or "sleep"
    label: Optional[str] = None
    extra: Optional[str] = None

class SleepRecord(SleepRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SleepRecordCreate(SleepRecordBase):
    pass

class SleepRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[str] = None
    label: Optional[str] = None
    extra: Optional[str] = None

# ============ WORD (SPEAKING) MODELS ============

class WordEntryBase(SQLModel):
    child_id: str = Field(foreign_key="child.id")
    name: str  # The word itself
    date: str  # YYYY-MM-DD format
    note: Optional[str] = None

class WordEntry(WordEntryBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WordEntryCreate(WordEntryBase):
    pass

class WordEntryUpdate(SQLModel):
    date: Optional[str] = None
    note: Optional[str] = None

# ============ TEETH MODELS ============

class TeethRecordBase(SQLModel):
    child_id: str = Field(foreign_key="child.id")
    tooth_id: str  # Name/position of the tooth
    date: str  # YYYY-MM-DD format

class TeethRecord(TeethRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TeethRecordCreate(TeethRecordBase):
    pass

class TeethRecordUpdate(SQLModel):
    date: Optional[str] = None

# ============ FOOD MODELS ============

class FoodRecordBase(SQLModel):
    child_id: str = Field(foreign_key="child.id")
    category: str  # "cereal", "fruit", "vegetable", "meat", "legume", "herbs", "other"
    food_name: str
    date: str  # YYYY-MM-DD format

class FoodRecord(FoodRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FoodRecordCreate(FoodRecordBase):
    pass

class FoodRecordUpdate(SQLModel):
    food_name: Optional[str] = None
    date: Optional[str] = None
    category: Optional[str] = None