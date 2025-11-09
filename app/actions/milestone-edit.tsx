import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import { formatDateLocal, formatDateToCzech, toIsoDate } from "@/components/IsoFormatDate";
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
  const { milId } = useLocalSearchParams<{ milId: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  const selectedChild =
    selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;

  useEffect(() => {
    if (!selectedChild || !milId) return;

    const milestone = selectedChild.milestones?.find((m) => m.milId === milId);
    if (milestone) {
      const isoDate = toIsoDate(milestone.date); 
      setName(milestone.name);
      setDate(toIsoDate(milestone.date));
      setOriginalDate(isoDate); 
      setNote(milestone.note || "");
      const found = MILESTONES.find((m) => m.label === milestone.name);
      if (found) setSelectedMilestone(found.id);
    }
  }, [milId, selectedChild]);

    const handleSave = () => {
      if (!selectedChild || !milId) return;

    const finalName = name.trim() !== "" 
      ? name 
      : MILESTONES.find(m => m.id === selectedMilestone)?.label || "";

    const updatedMilestone: Milestone = {
      milId: milId as string,
      name: finalName,
      date: formatDateToCzech(date),
      note,
    };

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex!];
    const milestones = child.milestones ?? [];
    const idx = milestones.findIndex((m) => m.milId === milId);
    if (idx >= 0) {
      milestones[idx] = updatedMilestone;
    }
    child.milestones = milestones;

    saveAllChildren(updatedChildren);
    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader>
        {selectedChildIndex !== null && milId && (
          <DeleteButton type="milestone" id={milId as string} 
          onDeleteSuccess={() => router.replace("/actions/milestone")}/>
        )}
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Upravit milník</Title>
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
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
          <View style={{ width: "80%" }}>
            <ValidatedDateInput
              value={date}
              onChange={(d) => d && setDate(d)}
              birthISO={selectedChild ? selectedChild.birthDate : null}
              fallbackOnError="original"
              originalValue={originalDate ?? undefined}
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
        <CheckButton onPress = {handleSave} />
      </ScrollView>
    </MainScreenContainer>
  );
}