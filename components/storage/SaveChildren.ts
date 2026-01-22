import AsyncStorage from "@react-native-async-storage/async-storage";

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
  weight?: string;
  height?: string;
  head?: string;
  foot?: string;
  clothes?: string;
};

export interface BreastfeedingRecord {
  id: string;
  date: string;
  time: string;
  state: "start" | "stop";
};

export interface GroupedBreastfeedingRecord {
  date: string;
  totalFeedMinutes: number;
  records: RecordTypeFeed[];
}

export interface RecordTypeFeed {
  time: string; // HH:MM
  date: string; // YYYY-MM-DD
  state: "start" | "stop";
  ts?: number;
};

export interface SleepRecord {
  id: string;
  date: string;
  time: string;
  state: "awake" | "sleep";
};

export interface GroupedSleepRecord {
  date: string;
  totalSleepMinutes: number;
  records: (RecordTypeSleep & { ts: number })[];
  nightSleepMinutes?: number;
};

export interface RecordTypeSleep {
  label: string;
  time: string; // HH:MM
  date: string; // YYYY-MM-DD
  state: "awake" | "sleep";
  extra?: string;
};

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

export type FoodDates = Record<string, string>;

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
  groupedSleep?: GroupedSleepRecord[];
  breastfeedingRecords?: BreastfeedingRecord[];
  groupedFeed?: GroupedBreastfeedingRecord[];
  currentModeFeed?: {
    mode: "start" | "stop";
    start: number;
  } | null;
}

const STORAGE_KEY = 'children';

/**
 * Uloží nové dítě do AsyncStorage.
 * Vrací `true`, pokud vše proběhlo bez chyby.
 */
export const saveChildren = async (newChild: Child): Promise<boolean> => {
  try {
    // Načti existující záznamy (pokud žádné nejsou → prázdné pole)
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const kids: Child[] = raw ? JSON.parse(raw) : [];

    // Přidej nové dítě
    kids.push(newChild);

    // Ulož zpět
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(kids));

    return true;
  } catch (error) {
    console.error('Chyba při ukládání dítěte:', error);
    return false;
  }
};