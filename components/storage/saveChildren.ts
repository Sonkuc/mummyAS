import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveDitko = async (noveDitko: {
  jmeno: string;
  pohlavi: string;
  datumNarozeni: Date;
}) => {
  try {
    const staraData = await AsyncStorage.getItem("deti");
    const deti = staraData ? JSON.parse(staraData) : [];
    deti.push(noveDitko);
    await AsyncStorage.setItem("deti", JSON.stringify(deti));
    console.log("Uloženo!");
    return true;
  } catch (e) {
    console.error("Chyba při ukládání", e);
    return false;
  }
};
