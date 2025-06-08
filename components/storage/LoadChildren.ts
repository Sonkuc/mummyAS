import AsyncStorage from "@react-native-async-storage/async-storage";
import { Child } from "./SaveChildren";

const STORAGE_KEY = 'children';

/**
 * Načte pole dětí uložené v AsyncStorage.
 * Pokud žádná data nejsou, vrátí prázdné pole.
 */
export const loadChildren = async (): Promise<Child[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Child[]) : [];
  } catch (error) {
    console.error('Chyba při načítání dětí:', error);
    return [];
  }
};