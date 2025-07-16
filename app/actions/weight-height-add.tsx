import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import { WeightHeight } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function WeightHeightAdd() {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [height, setHeight] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  
  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
  };

  const handleAdd = () => {
    if (selectedChildIndex === null) return;

    const newWh: WeightHeight = {
      date: formatDate(date),
      weight,
      height,
    };

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const existingWh = child.wh || [];

    child.wh = [...existingWh, newWh];

    saveAllChildren(updatedChildren);

    router.replace("/actions/weight-height");
  };

  return (
    <MainScreenContainer>
      <View style={{ marginBottom: -25 }}>
        <CustomHeader />
      </View>
      <Title>Přidat záznam</Title>
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
      <CheckButton onPress = {handleAdd} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "500",
  },
});