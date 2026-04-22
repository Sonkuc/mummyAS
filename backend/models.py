from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, JSON
from enum import Enum

# ============ USER MODELS ============

class UserProfileBase(SQLModel):
    id: str = Field(primary_key=True)
    email: str
    gender: str  # "mum" nebo "dad"

class UserProfile(UserProfileBase, table=True):
    __tablename__ = "profiles"  
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    children: List["Child"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class UserProfileRead(UserProfileBase):
    id: str
    created_at: datetime


# ============ CHILD MODELS ============

class ChildBase(SQLModel):
    id: Optional[str] = None
    user_id: str = Field(foreign_key="profiles.id", nullable=False)
    name: str
    birthDate: str
    sex: str
    photo: Optional[str] = None
    currentModeFeed: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    currentModeSleep: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
class ChildRead(ChildBase):
    id: str
    user_id: str = Field(foreign_key="profiles.id", nullable=False)
    milestones: List["MilestoneRead"] = Field(default_factory=list) 
    teethRecords: List["TeethRecordRead"] = Field(default_factory=list)
    words: List["SpeakingRead"] = Field(default_factory=list)
    wh: List["WeightHeightRead"] = Field(default_factory=list)
    foodRecords: List["FoodRecordRead"] = Field(default_factory=list)
    sleepRecords: List["SleepRecordRead"] = Field(default_factory=list)
    breastfeedingRecords: List["BreastfeedingRecordRead"] = Field(default_factory=list)   
    diaryEntries: List["DiaryRead"] = Field(default_factory=list)

class Child(ChildBase, table=True):
    __tablename__ = "children"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="profiles.id", index=True, ondelete="CASCADE")
    user: Optional[UserProfile] = Relationship(back_populates="children")

    milestones: List["Milestone"] = Relationship(
        back_populates="child", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    teethRecords: List["TeethRecord"] = Relationship(
        back_populates="child", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    words: List["Speaking"] = Relationship(
        back_populates="child", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    wh: List["WeightHeight"] = Relationship(
        back_populates="child", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    foodRecords: List["FoodRecord"] = Relationship(
        back_populates="child", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    sleepRecords: List["SleepRecord"] = Relationship(
        back_populates="child", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    breastfeedingRecords: List["BreastfeedingRecord"] = Relationship(
        back_populates="child", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    diaryEntries: List["Diary"] = Relationship(
        back_populates="child", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class ChildCreate(SQLModel):
    id: Optional[str] = None
    user_id: str = Field(foreign_key="profiles.id", nullable=False)
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
    child_id: str = Field(foreign_key="children.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: "Child" = Relationship(back_populates="milestones")

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(SQLModel):
    name: Optional[str] = None
    date: Optional[str] = None
    note: Optional[str] = None

# ============ WEIGHT/HEIGHT MODELS ============

class WeightHeightBase(SQLModel):
    date: Optional[str] = None
    weight: Optional[float] = None  # in kg
    height: Optional[float] = None  # in cm
    head: Optional[float] = None  # in cm
    foot: Optional[str] = None
    clothes: Optional[str] = None

    @classmethod
    def __get_validators__(cls):
        yield cls.validate_empty_strings

    @classmethod
    def validate_empty_strings(cls, v):
        if isinstance(v, dict):
            for key in ["weight", "height", "head"]:
                if v.get(key) == "":
                    v[key] = None
        return v
    
class WeightHeightRead(WeightHeightBase):
    id: str
    child_id: str
    created_at: datetime

class WeightHeight(WeightHeightBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
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
    note: Optional[str] = None

class BreastfeedingRecordRead(BreastfeedingRecordBase):
    id: str
    child_id: str
    created_at: datetime

class BreastfeedingRecord(BreastfeedingRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: "Child" = Relationship(back_populates="breastfeedingRecords")

class BreastfeedingRecordCreate(BreastfeedingRecordBase):
    id: Optional[str] = None  

class BreastfeedingRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[BreastfeedingState] = None
    note: Optional[str] = None

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
    note: Optional[str] = None

class SleepRecordRead(SleepRecordBase):
    id: str
    child_id: str
    created_at: datetime

class SleepRecord(SleepRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: "Child" = Relationship(back_populates="sleepRecords")

class SleepRecordCreate(SleepRecordBase):
    id: Optional[str] = None

class SleepRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[SleepState] = None
    label: Optional[str] = None
    extra: Optional[str] = None
    note: Optional[str] = None

class SleepDaySummary(SQLModel):
    date: str
    total_minutes: int

# --- ENTRY MODEL ---
class WordEntryBase(SQLModel):
    date: str  # YYYY-MM-DD
    note: Optional[str] = None

class WordEntry(WordEntryBase, table=True):
    __tablename__ = "word_entries"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    word_id: str = Field(foreign_key="speaking.id", ondelete="CASCADE")
    
    # Relace zpět na hlavní slovo
    word: "Speaking" = Relationship(back_populates="entries")

class WordEntryUpdate(SQLModel):
    date: Optional[str] = None
    note: Optional[str] = None

# --- MAIN WORD MODEL ---
class SpeakingBase(SQLModel):
    name: str  # Např. "Ahoj"

class Speaking(SpeakingBase, table=True):
    __tablename__ = "speaking"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
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
    child_id: str = Field(foreign_key="children.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
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
    food_name: str
    category: FoodCategory # "cereal", "fruit", ...
    date: Optional[str] = "" # YYYY-MM-DD format
    note: Optional[str] = None

class FoodRecordRead(FoodRecordBase):
    id: str
    child_id: str
    created_at: datetime

class FoodRecord(FoodRecordBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: "Child" = Relationship(back_populates="foodRecords")

class FoodRecordCreate(FoodRecordBase):
    pass

class FoodRecordUpdate(SQLModel):
    food_name: Optional[str] = None
    date: Optional[str] = None
    category: Optional[FoodCategory] = None
    note: Optional[str] = None

# ============ DIARY MODELS ============

class DiaryBase(SQLModel):
    text: str
    date: str  # YYYY-MM-DD
    name: str  # HH:MM
    category: Optional[str] = "obecné"

class Diary(DiaryBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: "Child" = Relationship(back_populates="diaryEntries")

class DiaryRead(DiaryBase):
    id: str
    child_id: str
    created_at: datetime

class DiaryCreate(DiaryBase): # Dědí text, date, name, category. 
    pass

class DiaryUpdate(SQLModel):
    text: Optional[str] = None
    date: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None