import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
import { Milestone } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { MILESTONES } from "@/data/milestones";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function AddMilestone() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  
  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
  };

  const handleAdd = () => {
    const finalName = name.trim() !== "" 
      ? name 
      : MILESTONES.find(m => m.id === selectedMilestone)?.label || "";

    const newMilestone: Milestone = {
      name: finalName,
      date: formatDate(date),
      note,
    };

    if (selectedChildIndex === null) return;

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const existingMilestones = child.milestones || [];

    child.milestones = [...existingMilestones, newMilestone];

      saveAllChildren(updatedChildren);

      router.replace("/actions/milestone");
  };

  return (
    <MainScreenContainer>
        <CustomHeader />
      <Title>Přidat milník</Title>
      <View style={{marginTop: 10, gap: 10}}>
        <MyTextInput
          placeholder="Např. První úsměv"
          value={name}
          onChangeText={text => {
            setName(text);
            setSelectedMilestone(""); // zruší výběr z pickeru, pokud píšu vlastní text
          }}
        />
        <MyPicker
          data={MILESTONES}
          selectedValue={selectedMilestone}
          onChange={setSelectedMilestone}
          setName={setName}
        />
        <Subtitle>Datum</Subtitle>
      </View>
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
      <Subtitle style={{marginTop: 10}}>Poznámka</Subtitle>
      <MyTextInput
              placeholder="Např. u babičky"
              value={note}
              onChangeText={setNote}
      />
      <CheckButton onPress = {handleAdd} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "500",
  },
});