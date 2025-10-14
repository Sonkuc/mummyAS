import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import { formatDateToCzech, toIsoDate } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
import { Milestone } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { useChild } from "@/contexts/ChildContext";
import { MILESTONES } from "@/data/milestones";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

export default function EditMilestone() {
  const { milIndex } = useLocalSearchParams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  const selectedChild =
    selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;

  useEffect(() => {
    if (
      selectedChildIndex !== null &&
      milIndex !== undefined &&
      allChildren[selectedChildIndex]?.milestones
    ) {
      const idx = Number(milIndex);
      const milestone = allChildren[selectedChildIndex].milestones[idx];
      if (milestone) {
        setName(milestone.name);
        setDate(toIsoDate(milestone.date));
        setNote(milestone.note || "");
        const found = MILESTONES.find((m) => m.label === milestone.name);
        if (found) setSelectedMilestone(found.id);
      }
    }
  }, [milIndex, selectedChildIndex, allChildren]);

  const handleSave = () => {
    if (selectedChildIndex === null || milIndex === undefined) return;

    const finalName = name.trim() !== "" 
      ? name 
      : MILESTONES.find(m => m.id === selectedMilestone)?.label || "";

    const updatedMilestone: Milestone = {
      name: finalName,
      date: formatDateToCzech(date),
      note,
    };

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const idx = Number(milIndex);

    if (child.milestones && child.milestones[idx]) {
      child.milestones[idx] = updatedMilestone;
    }

    saveAllChildren(updatedChildren);
    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader>
        {selectedChildIndex !== null && milIndex !== undefined && (
          <DeleteButton type="milestone" index={Number(milIndex)} 
          onDeleteSuccess={() => router.replace("/actions/milestone")}/>
        )}
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Upravit milník</Title>
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
        <Subtitle style={{marginTop: 10}}>Poznámka</Subtitle>
        <MyTextInput
          placeholder="Např. u babičky"
          value={note}
          onChangeText={setNote}
        />
        <CheckButton onPress = {handleSave} />
      </ScrollView>
    </MainScreenContainer>
  );
}