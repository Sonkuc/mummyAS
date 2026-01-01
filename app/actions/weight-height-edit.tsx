import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import HideButton from "@/components/HideButton";
import { formatDateLocal, formatDateToCzech, toIsoDate } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import { WeightHeight } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

export default function WeightHeightEdit() {
  const { whIndex } = useLocalSearchParams();
  const router = useRouter();
  const [date, setDate] = useState(formatDateLocal(new Date()));   
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [head, setHead] = useState("");
  const [foot, setFoot] = useState("");
  const [clothes, setClothes] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  const selectedChild =
    selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;

  const [hideMode, setHideMode] = useState(false);
  const HIDE_MODE_KEY = "hideMode";
  const idx = Number(whIndex);
  if (isNaN(idx)) return;

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

  useEffect(() => { 
    if ( 
      selectedChildIndex !== null && 
      whIndex !== undefined && 
      allChildren[selectedChildIndex]?.wh 
    ) {  
      const whRecord = allChildren[selectedChildIndex].wh[idx]; 
      if (whRecord) { 
        const isoDate = toIsoDate(whRecord.date); 
        setDate(isoDate); 
        setOriginalDate(isoDate); 
        setWeight(whRecord.weight || ""); 
        setHeight(whRecord.height || ""); 
        setHead(whRecord.head || ""); 
        setFoot(whRecord.foot || ""); 
        setClothes(whRecord.clothes || ""); 
      } 
    } 
  }, [whIndex, selectedChildIndex, allChildren]);
        
  const handleSave = () => {
    if (selectedChildIndex === null || selectedChildIndex === undefined) return;
    
    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const existingWh = child.wh || [];
    
    const formattedDate = formatDateToCzech(date);
      const dateExists = existingWh.some(
        (wh, i) => i !== idx && wh.date === formattedDate
      );    
      if (dateExists) {
        Alert.alert("Záznam pro toto datum už existuje.");
        return;
      }

    const updatedWh: WeightHeight = {
      date: formatDateToCzech(date),
      weight,
      height,
      head,
      foot,
      clothes,
    };

    existingWh[idx] = updatedWh;
    child.wh = existingWh;

    saveAllChildren(updatedChildren);

    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader>
        {selectedChildIndex !== null && whIndex !== undefined && (
          <DeleteButton 
            type="wh" 
            index={Number(whIndex)} 
            onDeleteSuccess={() => router.replace("/actions/weight-height")}
          />
        )}
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Upravit záznam</Title>
        <Subtitle>Datum</Subtitle>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ width: "80%" }}>
            <ValidatedDateInput
              value={date}
              onChange={(val) => val && setDate(val)}
              birthISO={selectedChild?.birthDate ?? null}
              fallbackOnError="original"
              originalValue={originalDate ?? undefined}
            />
          </View>
          <DateSelector
            date={new Date(date)}
            onChange={(newDate) => {
              setDate(formatDateLocal(newDate));
            }}
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

            <Subtitle>Velikost oblečení</Subtitle>
            <MyTextInput
              placeholder="Konfekční velikost"
              value={clothes}
              keyboardType="numeric"
              onChangeText={(textC) => setClothes(validateNumberInput(textC))}
            />
          </>
        )}    
        <CheckButton onPress = {handleSave} />
      </ScrollView>
    </MainScreenContainer>
  );
}