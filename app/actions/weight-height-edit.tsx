import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import { WeightHeight } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function WeightHeightEdit() {
  const { whIndex } = useLocalSearchParams();
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();

  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
  };

  const toIsoDate = (czDate: string) => {
    const [day, month, year] = czDate.split(".");
    return `${year}-${month}-${day}`;
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
      }
    }
  }, [whIndex, selectedChildIndex, allChildren]);

  const handleSave = () => {
    if (selectedChildIndex === null || selectedChildIndex === undefined) return;

    const updatedWh: WeightHeight = {
      date: formatDate(date),
      weight,
      height,
    };
    
    const idx = Number(whIndex);
    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const existingWh = child.wh || [];

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
      <CheckButton onPress = {handleSave} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "500",
  },
});