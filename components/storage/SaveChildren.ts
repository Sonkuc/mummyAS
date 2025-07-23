import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

export interface Milestone {
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

export type Word = {
  name: string;
  entries: { date: string; note: string }[];
};

export type ToothDates = Record<string, string>;

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
    
    const newChildWithId: Child = {
      ...newChild,
      id: uuidv4(),
    };

    // Přidej nové dítě
    kids.push(newChildWithId);

    // Ulož zpět
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(kids));

    return true;
  } catch (error) {
    console.error('Chyba při ukládání dítěte:', error);
    return false;
  }
};