import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import HideButton from "@/components/HideButton";
import { IsoFormatDate } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import { WeightHeight } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

export default function WeightHeightAdd() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { formatDateToCzech, toIsoDate } = IsoFormatDate();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [head, setHead] = useState("");
  const [foot, setFoot] = useState("");
  const [clothes, setClothes] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  const selectedChild =
    selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;

  const [hideMode, setHideMode] = useState(false);
  const HIDE_MODE_KEY = "hideMode";
  
  const validateNumberInput = (text: string) => {
    // povolíme čísla + jeden oddělovač (tečka nebo čárka)
    let cleaned = text.replace(/[^0-9.,]/g, "");

    // pokud má víc než jednu tečku/čárku, necháme jen první
    const parts = cleaned.split(/[,\.]/);
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts[1]; // první část + jedna desetinná
    } else if (parts.length === 2) {
      cleaned = parts[0] + "." + parts[1]; // normalizace na tečku
    }
    if (cleaned.startsWith(".") || cleaned.startsWith(",")) {
      cleaned = "0" + cleaned.replace(",", ".");
    }

    return cleaned;
  };

  useEffect(() => {
    const loadHideMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(HIDE_MODE_KEY);
        if (stored !== null) {
          setHideMode(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Chyba při načítání hideMode:", e);
      }
    };

    loadHideMode();
  }, []);

    const toggleHideMode = async () => {
      const newValue = !hideMode;
      setHideMode(newValue);
      try {
        await AsyncStorage.setItem(HIDE_MODE_KEY, JSON.stringify(newValue));
      } catch (e) {
        console.error("Chyba při ukládání hideMode:", e);
      }
    };

  const handleAdd = () => {
    if (selectedChildIndex === null) return;

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const existingWh = child.wh || [];

    const formattedDate = formatDateToCzech(date);
      const dateExists = existingWh.some(
        (wh) => wh.date === formattedDate
      );
        
      if (dateExists) {
        Alert.alert("Záznam pro toto datum už existuje.");
        return;
      }

    const newWh: WeightHeight = {
      date: formatDateToCzech(date),
      weight,
      height,
      head,
      foot,
      clothes,
    };
  
    child.wh = [...existingWh, newWh];
    saveAllChildren(updatedChildren);

    router.replace("/actions/weight-height");
  };

  return (
    <MainScreenContainer>
      <CustomHeader/> 
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Přidat záznam</Title>
        <Subtitle>Datum</Subtitle>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
          <View style={{ width: "80%" }}>
            <ValidatedDateInput
              value={date}
              onChange={setDate}
              birthISO={selectedChild ? selectedChild.birthDate : null}
            />
          </View>
          <DateSelector
            date={new Date(date)}
            onChange={(newDate) => setDate(newDate.toISOString().slice(0, 10))}
          />
        </View>
        <Subtitle>Váha</Subtitle>
        <MyTextInput
          placeholder="Váha v kg"
          value={weight}
          keyboardType="numeric"
          onChangeText={(textW) => setWeight(validateNumberInput(textW))}
        />
        <Subtitle>Výška</Subtitle>
        <MyTextInput
          placeholder="Výška v cm"
          value={height}
          keyboardType="numeric"
          onChangeText={(textH) => setHeight(validateNumberInput(textH))}
        />
        <View style={{alignSelf: "flex-end", right: 10}}>
          <HideButton 
            hideMode={hideMode}
            onPress={toggleHideMode}
          />
        </View>
        {!hideMode && (
          <>
            <Subtitle style={{marginTop: -20}}>Obvod hlavy</Subtitle>
            <MyTextInput
              placeholder="Obvod v cm"
              value={head}
              keyboardType="numeric"
              onChangeText={(textHead) => setHead(validateNumberInput(textHead))}
            />
            <Subtitle>Velikost chodidla</Subtitle>
            <MyTextInput
              placeholder="Velikost nohy"
              value={foot}
              keyboardType="numeric"
              onChangeText={(textF) => setFoot(validateNumberInput(textF))}
            />
            <Subtitle>Konfekční oblečení</Subtitle>
            <MyTextInput
              placeholder="Velikost oblečení"
              value={clothes}
              keyboardType="numeric"
              onChangeText={(textC) => setClothes(validateNumberInput(textC))}
            />
          </>
        )}
        <CheckButton onPress = {handleAdd} />
      </ScrollView>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "500",
  },
});