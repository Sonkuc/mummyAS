import AsyncStorage from "@react-native-async-storage/async-storage";
import { Child } from "./saveChildren";

export const loadChildren = async (): Promise<Child[]> => {
  try {
    const raw = await AsyncStorage.getItem("kids");
    console.log("loadChildren → raw string:", raw);          // <—
    const parsed = raw ? (JSON.parse(raw) as Child[]) : [];
    console.log("loadChildren → parsed.length:", parsed.length); // <—
    return parsed;
  } catch (e) {
    console.error("Chyba při načítání dětí:", e);
    return [];
  }
};