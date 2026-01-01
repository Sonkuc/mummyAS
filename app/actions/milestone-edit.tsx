import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import { formatDateLocal, formatDateToCzech, toIsoDate } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
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
    if (!selectedChild || milId === undefined) return;

    const idx = Number(milId);
    const milestone = selectedChild.milestones?.[idx];
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
    if (selectedChildIndex === null || milId === undefined) return;

    const idx = Number(milId);
    const finalName = name.trim();
    
    if (!finalName) return; // Ochrana proti prázdnému názvu

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];
    const milestones = [...(child.milestones ?? [])];
    
    // Aktualizace konkrétního milníku na daném indexu
    milestones[idx] = {
      ...milestones[idx], // zachová případná data, která needitujeme
      name: finalName,
      date: formatDateToCzech(date),
      note,
    };
    
    child.milestones = milestones;
    saveAllChildren(updatedChildren);
    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader>
        {selectedChildIndex !== null && milId !== undefined && (
          <DeleteButton type="milestone" index={Number(milId)} 
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
              if (text !== "") setSelectedMilestone("");
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