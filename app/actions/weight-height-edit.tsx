import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import HideButton from "@/components/HideButton";
import { formatDateLocal, toIsoDate } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import * as api from "@/components/storage/api";
import { WeightHeight } from "@/components/storage/interfaces";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

export default function WeightHeightEdit() {
  const { whId } = useLocalSearchParams<{ whId: string }>();
  const router = useRouter();

  const [date, setDate] = useState(formatDateLocal(new Date()));   
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [head, setHead] = useState("");
  const [foot, setFoot] = useState("");
  const [clothes, setClothes] = useState("");
  const { selectedChildId, selectedChild, reloadChildren } = useChild();

  const [hideMode, setHideMode] = useState(false);
  const HIDE_MODE_KEY = "hideMode";

  const currentWhRecord = useMemo(() => {
    return selectedChild?.wh?.find((wh: WeightHeight) => wh.id === whId);
  }, [whId, selectedChild]);

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
    if (currentWhRecord) {
      // zajistí, že výsledek je vždy string, nahradí tečku čárkou
      const formatForInput = (val: any) => {
        if (val === null || val === undefined) return "";
        return String(val).replace(".", ",");
      };

      setWeight(formatForInput(currentWhRecord.weight));
      setHeight(formatForInput(currentWhRecord.height));
      setHead(formatForInput(currentWhRecord.head));
      setFoot(formatForInput(currentWhRecord.foot));
      setClothes(currentWhRecord.clothes ? String(currentWhRecord.clothes) : "");

      // Zbytek logiky pro datum
      let rawDate = currentWhRecord.date;
      if (rawDate.includes("/") || rawDate.includes(".")) {
        rawDate = toIsoDate(rawDate);
      }
      if (!rawDate || rawDate.includes("undefined")) {
        rawDate = new Date().toISOString().slice(0, 10);
      }

      setDate(rawDate);
      setOriginalDate(rawDate);
    }
  }, [currentWhRecord]);
        
  const handleSave = async () => {
    if (!selectedChildId || !whId) return;
    
    const dateExists = selectedChild?.wh?.some(
      (wh: any) => wh.id !== whId && wh.date === date
    );   

    if (dateExists) {
      Alert.alert("Chyba", "Záznam pro toto datum už existuje.");
      return;
    }

    try {
      await api.updateWeightHeight(selectedChildId, whId, {
        date: date,
        weight,
        height,
        head,
        foot,
        clothes,
      });
    
      await reloadChildren();
        router.back();
      } catch (error) {
        console.error("Chyba při ukládání:", error);
        Alert.alert("Chyba", "Nepodařilo se uložit změny.");
      }
  };

  return (
    <MainScreenContainer>
      <CustomHeader>
          {selectedChildId ? (
            <DeleteButton 
              type="wh" 
              childId={selectedChildId} 
              recordId={whId}
              onDeleteSuccess={() => router.replace("/actions/weight-height")}              />
          ) : null}
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