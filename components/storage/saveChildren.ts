import AsyncStorage from '@react-native-async-storage/async-storage';

export type Child = {
  jmeno: string;
  pohlavi: string;
  datumNarozeni: Date;
};

export const saveChildren = async (newChild: Child): Promise<boolean> => {
  try {
    const staraData = await AsyncStorage.getItem("kids");
    const kids: Child[] = staraData ? JSON.parse(staraData) : [];

    kids.push(newChild);
    await AsyncStorage.setItem("kids", JSON.stringify(kids));

    return true;
  } catch (e) {
    console.error("Chyba při ukládání:", e);
    return false;
  }
};
