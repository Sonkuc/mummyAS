import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Child {
  name: string;
  sex: string;
  birthDate: string;
  photo: string;
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