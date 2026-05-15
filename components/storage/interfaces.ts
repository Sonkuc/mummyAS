// ============ USER ============
export interface UserProfile {
  id: string;          
  email: string;
  created_at: string;
  gender: "mum" | "dad";
}

// ============ MILESTONE ============
export interface Milestone {
  id: string;
  child_id: string; 
  name: string;
  date: string;
  note?: string;
  created_at?: string;
}
export type MilestoneCreate = Omit<Milestone, 'id' | 'child_id'>;
export type MilestoneUpdate = Partial<MilestoneCreate>;

// ============ WEIGHT/HEIGHT ============
export interface WeightHeight {
  id: string;
  child_id: string;
  date: string;
  weight?: string | number | null; 
  height?: string | number | null;
  head?: string | number | null;
  foot?: string | null;
  clothes?: string | null;
}
export type WeightHeightCreate = Omit<WeightHeight, 'id'>;

// ============ BREASTFEEDING ============
export interface BreastfeedingRecord {
  id: string;
  child_id: string;
  date: string;
  time: string;
  state: "start" | "stop";
  note?: string;
}

export type BreastfeedingSyncItem = Omit<BreastfeedingRecord, 'child_id'>;
export type BreastfeedingSyncDay = BreastfeedingSyncItem[];

// Typ pro UI
export type DisplayBreastfeedingRecord = BreastfeedingRecord & { label: string };

// ============ SLEEP ============
export interface SleepRecord {
  id: string;
  child_id: string;
  date: string;
  time: string;
  state: "awake" | "sleep";
  note?: string;
}
export type SleepSyncItem = Omit<SleepRecord, 'child_id'>;
export type SleepSyncDay = SleepSyncItem[];

// Typ pro UI 
export type DisplaySleepRecord = SleepRecord & { label: string };

// ============ SPEAKING (WORDS) ============
export type WordEntry = {
  id: string;
  date: string;
  note?: string;
};

export type Word = {
  id: string;
  child_id: string;
  name: string;
  entries: WordEntry[];
  created_at?: string;
};
export type WordUpdatePayload = {
  name: string;
  entries: Omit<WordEntry, 'id'>[];
};

// ============ TEETH ============
export interface TeethRecord {
  id: string;
  tooth_id: string;
  date: string;
  child_id: string;
  created_at?: string;
}
export type TeethRecordSync = Omit<TeethRecord, 'id' | 'child_id' | 'created_at'>;

// ============ DIARY ============
export interface Diary {
  id: string;
  child_id: string;
  text?: string;
  name: string;    
  date: string;
  created_at?: string; 
}
export type DiaryCreate = Omit<Diary, 'id' | 'child_id' | 'created_at'>;
export type DiaryUpdate = Partial<DiaryCreate>;

// ============ FOOD ============

export type FoodCategory = 
  | "cereal" 
  | "fruit" 
  | "vegetable" 
  | "meat" 
  | "legume" 
  | "herbs" 
  | "other";
  
export interface FoodRecord {
  id: string;
  child_id: string;
  food_name: string;
  category: FoodCategory;
  date: string;
  note?: string;
}
export type FoodRecordCreate = Omit<FoodRecord, 'id' | 'child_id'>;
export type FoodRecordUpdate = Partial<FoodRecordCreate>;

// ============ CHILD ============
export interface Child {
  id: string;
  user_id: string;
  name: string;
  sex: string;
  birthDate: string;
  photo: string;
  milestones?: Milestone[];
  words?: Word[];
  teethRecords?: TeethRecord[]; 
  wh?: WeightHeight[];
  foodRecords?: FoodRecord[];
  sleepRecords?: SleepRecord[];
  currentModeSleep?: { mode: "awake" | "sleep"; start: string; } | null;
  breastfeedingRecords?: BreastfeedingRecord[];
  currentModeFeed?: { mode: "start" | "stop"; start: string; } | null;
  diaryRecords?:  Diary[];
}
export type ChildCreate = Omit<Child, 'id' | 'user_id' | 'milestones' | 'words' | 'teethRecords' | 'wh' | 'foodRecords' | 'sleepRecords' | 'breastfeedingRecords' | 'diaryRecords'>;
export type ChildUpdate = Partial<ChildCreate> & {
  currentModeSleep?: Child['currentModeSleep'];
  currentModeFeed?: Child['currentModeFeed'];
};