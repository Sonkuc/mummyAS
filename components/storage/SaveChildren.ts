import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Milestone {
  milId: string;       
  name: string;
  date: string; // ve formátu YYYY-MM-DD
  note?: string;
};

export interface WeightHeight {
  date: string;
  weight?: string;
  height?: string;
  head?: string;
  foot?: string;
  clothes?: string;
};

export interface BreastfeedingRecord {
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

export type Word = {
  name: string;
  entries: { date: string; note?: string }[];
};

export type ToothDates = Record<string, string>;
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