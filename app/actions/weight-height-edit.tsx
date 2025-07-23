import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import HideButton from "@/components/HideButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import { WeightHeight } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function WeightHeightEdit() {
  const { whIndex } = useLocalSearchParams();
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [head, setHead] = useState("");
  const [foot, setFoot] = useState("");
  const [clothes, setClothes] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  const [hideMode, setHideMode] = useState(false);
  const HIDE_MODE_KEY = "hideMode";

  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
  };

  const toIsoDate = (czDate: string) => {
    const [day, month, year] = czDate.split(".");
    return `${year}-${month}-${day}`;
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

  useEffect(() => {
    if (
      selectedChildIndex !== null &&
      whIndex !== undefined &&
      allChildren[selectedChildIndex]?.wh
    ) {
      const idx = Number(whIndex);
      const WeightHeight = allChildren[selectedChildIndex].wh[idx];
      if (WeightHeight) {
        setDate(toIsoDate(WeightHeight.date));
        setWeight(WeightHeight.weight || "");
        setHeight(WeightHeight.height || "");
        setHead(WeightHeight.head || "");
        setFoot(WeightHeight.foot || "");
        setClothes(WeightHeight.clothes || "");
      }
    }
  }, [whIndex, selectedChildIndex, allChildren]);

  const handleSave = () => {
    if (selectedChildIndex === null || selectedChildIndex === undefined) return;
    
    const idx = Number(whIndex);
    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const existingWh = child.wh || [];
    
    const formattedDate = formatDate(date);
      const dateExists = existingWh.some(
        (wh, i) => i !== idx && wh.date === formattedDate
      );
            
        if (dateExists) {
          Alert.alert("Záznam pro toto datum už existuje.");
          return;
        }

    const updatedWh: WeightHeight = {
      date: formatDate(date),
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
      <View style={{ marginBottom: -25 }}>
        <CustomHeader>
            {selectedChildIndex !== null && whIndex !== undefined && (
              <DeleteButton type="wh" index={Number(whIndex)} 
              onDeleteSuccess={() => router.replace("/actions/weight-height")}/>
            )}
        </CustomHeader>
      </View>
      <Title>Upravit záznam</Title>
      <Subtitle>Datum</Subtitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
        <View style={{ width: "80%" }}>
          <MyTextInput
                  placeholder="YYYY-MM-DD"
                  value={date}
                  onChangeText={setDate}
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
        onChangeText={textW => {
          setWeight(textW);
        }}
      />
      <Subtitle>Výška</Subtitle>
      <MyTextInput
        placeholder="Výška v cm"
        value={height}
        onChangeText={textH => {
          setHeight(textH);
        }}
      />
      {!hideMode && (
        <>
          <Subtitle>Obvod hlavy</Subtitle>
          <MyTextInput
            placeholder="Obvod v cm"
            value={head}
            onChangeText={textHead => {
              setHead(textHead);
            }}
          />
          <Subtitle>Velikost chodidla</Subtitle>
          <MyTextInput
            placeholder="Velikost nohy"
            value={foot}
            onChangeText={textF => {
              setFoot(textF);
            }}
          />
          <Subtitle>Velikost oblečení</Subtitle>
          <MyTextInput
            placeholder="Konfekční velikost"
            value={clothes}
            onChangeText={textC => {
              setClothes(textC);
            }}
          />
        </>
      )}    
      <CheckButton onPress = {handleSave} />
      <HideButton 
                  hideMode={hideMode}
                  onPress={toggleHideMode}
      />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "500",
  },
});