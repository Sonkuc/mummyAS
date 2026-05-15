import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import HideButton from "@/components/HideButton";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

export default function WeightHeightAdd() {
  const router = useRouter();
  const [date, setDate] = useState(formatDateLocal(new Date()));  
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [head, setHead] = useState("");
  const [foot, setFoot] = useState("");
  const [clothes, setClothes] = useState("");
  const { selectedChildId, selectedChild, addWeightHeightRecord } = useChild();
  const [isSaving, setIsSaving] = useState(false);

  const [hideMode, setHideMode] = useState(false);
  const HIDE_MODE_KEY = "hideMode";
  
  const validateNumberInput = (text: string) => {
    let cleaned = text.replace(/[^0-9.,]/g, "").replace(",", ".");
    const [integer, decimal] = cleaned.split(".");
    cleaned = integer + (decimal !== undefined ? "." + decimal.slice(0, 2) : "");
    return cleaned.startsWith(".") ? "0" + cleaned : cleaned;
  };

  useEffect(() => {
    AsyncStorage.getItem(HIDE_MODE_KEY)
      .then(stored => stored && setHideMode(JSON.parse(stored)))
      .catch(e => console.error("Chyba při načítání hideMode:", e));
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

  const handleAdd = async () => {
    if (isSaving) return;
    if (!selectedChildId || !selectedChild) return;

    // Kontrola duplicity (ponecháme)
    const dateExists = selectedChild.wh?.some((entry: any) => entry.date === date);
    if (dateExists) {
        Alert.alert("Chyba", "Záznam pro toto datum již existuje.");
        return;
    }

    setIsSaving(true);
    try {
        const parseNum = (val: string) => {
            const cleaned = val.replace(",", ".");
            return cleaned === "" ? null : Number(cleaned);
        };

        // 2. Zavoláme novou "lehkou" funkci
        await addWeightHeightRecord(selectedChildId, {
            date: date,
            weight: parseNum(weight),
            height: parseNum(height),
            head: parseNum(head),
            foot: foot.trim() || null,
            clothes: clothes.trim() || null,
        });

        router.back();
    } catch (error) {
        Alert.alert("Chyba", "Nepodařilo se uložit data.");
    } finally {
        setIsSaving(false);
    }
  };
  
  return (
    <MainScreenContainer>
      <CustomHeader/> 
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Přidat záznam</Title>
        <Subtitle>Datum</Subtitle>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
          <View style={{ width: "80%" }}>
            <ValidatedDateInput
              value={date}
              onChange={(d) => d && setDate(d)}
              birthISO={selectedChild ? selectedChild.birthDate : null}
            />
          </View>
          <DateSelector
            date={new Date(date)}
            onChange={(newDate) => setDate(formatDateLocal(newDate))}
            birthISO={selectedChild ? selectedChild.birthDate : null}
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
        <CheckButton onPress={handleAdd} disabled={isSaving} style={{ opacity: isSaving ? 0.5 : 1 }} />
      </ScrollView>
    </MainScreenContainer>
  );
}