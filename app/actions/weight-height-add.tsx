import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import HideButton from "@/components/HideButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import { WeightHeight } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function WeightHeightAdd() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
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

    const formattedDate = formatDate(date);
      const dateExists = existingWh.some(
        (wh) => wh.date === formattedDate
      );
        
      if (dateExists) {
        Alert.alert("Záznam pro toto datum už existuje.");
        return;
      }

    const newWh: WeightHeight = {
      date: formatDate(date),
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
      <Title>Přidat záznam</Title>
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
          <Subtitle>Konfekční oblečení</Subtitle>
          <MyTextInput
            placeholder="Velikost oblečení"
            value={clothes}
            onChangeText={textC => {
              setClothes(textC);
            }}
          />
        </>
      )}
      <CheckButton onPress = {handleAdd} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "500",
  },
});