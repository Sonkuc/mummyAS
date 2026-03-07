
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

export interface FoodRecord {
  id: string;
  child_id: string;
  food_name: string; // Backend název
  category: string;
  date: string;      // ISO formát
}

export type FoodDates = Record<string, string>; // Mapa: { "Jablko": "2026-01-31" }

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
  foodDates?: FoodDates;
  foodCategories?: Record<string, string>;
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
}