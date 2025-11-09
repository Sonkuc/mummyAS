import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import { formatDateLocal, formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
import { Milestone } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { useChild } from "@/contexts/ChildContext";
import { MILESTONES } from "@/data/milestones";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import uuid from "react-native-uuid";

export default function AddMilestone() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [note, setNote] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  const selectedChild =
    selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;
  
  const handleAdd = () => {
    const finalName = name.trim() !== "" 
      ? name 
      : MILESTONES.find(m => m.id === selectedMilestone)?.label || "";

    const newMilestone: Milestone = {
      milId: uuid.v4() as string,
      name: finalName,
      date: formatDateToCzech(date),
      note,
    };

    if (selectedChildIndex === null) return;

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const existingMilestones = child.milestones || [];

    child.milestones = [...existingMilestones, newMilestone];

    saveAllChildren(updatedChildren);

    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader/>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Přidat milník</Title>
        <View style={{marginTop: 10}}>
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
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
        <Subtitle style={{marginTop: 10}}>Poznámka</Subtitle>
        <MyTextInput
          placeholder="Např. u babičky"
          value={note}
          onChangeText={setNote}
        />
        <CheckButton onPress = {handleAdd} />
      </ScrollView>
    </MainScreenContainer>
  );
}
