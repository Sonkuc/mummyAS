
export interface Milestone {
  id: string;
  child_id: string; 
  name: string;
  date: string;
  note?: string;
};

export interface WeightHeight {
  id: string;
  date: string;
  weight?: string | number | null; 
  height?: string | number | null;
  head?: string | number | null;
  foot?: string | null;
  clothes?: string | null;
}

export interface BreastfeedingRecord {
  id: string;
  date: string;
  time: string;
  state: "start" | "stop";
  note?: string;
};

export interface BreastfeedingStats {
  date: string;
  total_minutes: number;
}

export interface SleepRecord {
  id: string;
  date: string;
  time: string;
  state: "awake" | "sleep";
  note?: string;
};

export interface SleepStats {
  date: string;
  total_minutes: number;
}

export type WordEntry = {
  id: string;      // ID záznamu z DB
  date: string;    // YYYY-MM-DD
  note?: string;   // Volitelná poznámka
};

export type Word = {
  id: string;      // ID slova z DB
  child_id: string;
  name: string;
  entries: WordEntry[]; // Pole objektů s vlastními ID
};

export type ToothDates = Record<string, string>;
export interface TeethRecord {
  id: string;  // Backend-generated UUID
  tooth_id: string;
  date: string;
  child_id: string;
  created_at: string;  // Optional, if needed
};

export interface Diary {
  id: string;
  child_id: string;
  text?: string;
  name: string;    
  date: string;     // YYYY-MM-DD
  created_at?: string; 
}

export type DiaryCreate = Omit<Diary, 'id' | 'child_id' | 'created_at'>;
export type DiaryUpdate = Partial<DiaryCreate>;

export interface FoodRecord {
  id: string;
  child_id: string;
  food_name: string; // Backend název
  category: string;
  date: string;      // ISO formát
  note?: string;
}

export interface Child {
  id: string;
  name: string;
  sex: string;
  birthDate: string;
  photo: string;
  milestones?: Milestone[];
  words?: Word[];
  teethDates?: ToothDates;
  teethRecords?: TeethRecord[]; 
  wh?: WeightHeight[];
  foodRecords?: FoodRecord[];
  sleepRecords?: SleepRecord[];
  currentModeSleep?: {
    mode: "awake" | "sleep";
    start: number;
  } | null;
  breastfeedingRecords?: BreastfeedingRecord[];
  currentModeFeed?: {
    mode: "start" | "stop";
    start: number;
  } | null;
  diaryRecords?:  Diary[];
}