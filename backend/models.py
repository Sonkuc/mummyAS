from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, Any
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, JSON
from enum import Enum
from pydantic import model_validator

# ============ USER MODELS ============

class UserProfileBase(SQLModel):
    id: str = Field(primary_key=True)
    email: str
    gender: str = "not_set"  # Přidán default pro stabilitu při registraci

class UserProfile(UserProfileBase, table=True):
    __tablename__ = "profiles"
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Hierarchie: Smazáním uživatele se smažou i děti
    children: List["Child"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin"
        }
    )

class UserProfileRead(UserProfileBase):
    created_at: datetime


# ============ CHILD MODELS ============
class CurrentModeFeed(SQLModel):
    mode: str  # start / stop
    start: str

class CurrentModeSleep(SQLModel):
    mode: str  # awake / sleep
    start: str
    
class ChildBase(SQLModel):
    name: str
    birthDate: str
    sex: str
    photo: Optional[str] = None
    currentModeFeed: Optional[CurrentModeFeed] = Field(default=None, sa_column=Column(JSON))
    currentModeSleep: Optional[CurrentModeSleep] = Field(default=None, sa_column=Column(JSON))

# --- TABLE MODEL ---
class Child(ChildBase, table=True):
    __tablename__ = "children"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="profiles.id", index=True, ondelete="CASCADE")
    
    # Vazba na rodiče
    user: Optional["UserProfile"] = Relationship(back_populates="children")

    # Vazby na aktivity s kaskádovým mazáním (HIERARCHIE)
    milestones: List["Milestone"] = Relationship(
        back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    teethRecords: List["TeethRecord"] = Relationship(
        back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    words: List["Speaking"] = Relationship(
        back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    wh: List["WeightHeight"] = Relationship(
        back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    foodRecords: List["FoodRecord"] = Relationship(
        back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    sleepRecords: List["SleepRecord"] = Relationship(
        back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    breastfeedingRecords: List["BreastfeedingRecord"] = Relationship(
        back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    diaryRecords: List["Diary"] = Relationship(
        back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

# --- DTO MODELS (Pro API) ---
class ChildCreate(ChildBase):
    id: Optional[str] = None

class ChildUpdate(SQLModel):
    name: Optional[str] = None
    birthDate: Optional[str] = None
    sex: Optional[str] = None
    photo: Optional[str] = None
    currentModeFeed: Optional[CurrentModeFeed] = None
    currentModeSleep: Optional[CurrentModeSleep] = None

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
    diaryRecords: List["DiaryRead"] = Field(default_factory=list)

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
    child: Optional["Child"] = Relationship(back_populates="milestones")

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

    @model_validator(mode='before')
    @classmethod
    def validate_empty_to_none(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in ["weight", "height", "head"]:
                if data.get(field) == "":
                    data[field] = None
        return data
    
class WeightHeightRead(WeightHeightBase):
    id: str
    child_id: str
    created_at: datetime

class WeightHeight(WeightHeightBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: Optional["Child"] = Relationship(back_populates="wh")

class WeightHeightCreate(WeightHeightBase):
    pass


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
    __tablename__ = "breastfeeding_records"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: Optional["Child"] = Relationship(back_populates="breastfeedingRecords")

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
    note: Optional[str] = None

class SleepRecordRead(SleepRecordBase):
    id: str
    child_id: str
    created_at: datetime

class SleepRecord(SleepRecordBase, table=True):
    __tablename__ = "sleep_records"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: Optional["Child"] = Relationship(back_populates="sleepRecords")

class SleepRecordCreate(SleepRecordBase):
    id: Optional[str] = None

class SleepRecordUpdate(SQLModel):
    time: Optional[str] = None
    state: Optional[SleepState] = None
    note: Optional[str] = None

class SleepDaySummary(SQLModel):
    date: str
    total_minutes: int

# ============ ENTRY MODELS ============

class WordEntryBase(SQLModel):
    date: str  # YYYY-MM-DD
    note: Optional[str] = None

class WordEntry(WordEntryBase, table=True):
    __tablename__ = "word_entries"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    word_id: str = Field(foreign_key="speaking.id", ondelete="CASCADE")
    
    # Relace zpět na hlavní slovo
    word: "Speaking" = Relationship(back_populates="entries")

class WordEntryRead(WordEntryBase):
    id: str
    word_id: str

# --- MAIN WORD MODEL ---
class SpeakingBase(SQLModel):
    name: str  # Např. "Ahoj"

class Speaking(SpeakingBase, table=True):
    __tablename__ = "speaking"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relace na historii výslovností
    entries: List[WordEntry] = Relationship(back_populates="word", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    child: Optional["Child"] = Relationship(back_populates="words")

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
    entries: List[WordEntryRead] = []

# ============ TEETH MODELS ============

class TeethRecordBase(SQLModel):
    tooth_id: str  # Name/position of the tooth
    date: str  # YYYY-MM-DD format

class TeethRecordRead(TeethRecordBase):
    id: str
    child_id: str
    created_at: datetime

class TeethRecord(TeethRecordBase, table=True):
    __tablename__ = "teeth_records"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: Optional["Child"] = Relationship(back_populates="teethRecords")

class TeethRecordCreate(TeethRecordBase):
    pass


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
    date: str # YYYY-MM-DD format
    note: Optional[str] = None

class FoodRecordRead(FoodRecordBase):
    id: str
    child_id: str
    created_at: datetime

class FoodRecord(FoodRecordBase, table=True):
    __tablename__ = "food_records"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: Optional["Child"] = Relationship(back_populates="foodRecords")

class FoodRecordCreate(FoodRecordBase):
    pass

class FoodRecordUpdate(SQLModel):
    food_name: Optional[str] = None
    date: Optional[str] = None
    category: Optional[FoodCategory] = None
    note: Optional[str] = None

# ============ DIARY MODELS ============

class DiaryBase(SQLModel):
    date: str  # YYYY-MM-DD
    name: str
    text: Optional[str] = Field(default=None, nullable=True)


class Diary(DiaryBase, table=True):
    __tablename__ = "diary_records"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    child_id: str = Field(foreign_key="children.id", index=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    child: Optional["Child"] = Relationship(back_populates="diaryRecords")

class DiaryRead(DiaryBase):
    id: str
    child_id: str
    created_at: datetime

class DiaryCreate(DiaryBase): # Dědí text, date, name, ...
    pass

class DiaryUpdate(SQLModel):
    name: Optional[str] = None
    date: Optional[str] = None
    text: Optional[str] = None