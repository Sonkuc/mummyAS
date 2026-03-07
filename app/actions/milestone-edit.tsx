import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import { formatDateLocal, toIsoDate } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
import { Child, Milestone } from "@/components/storage/interfaces";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { useChild } from "@/contexts/ChildContext";
import { MILESTONES } from "@/data/milestones";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

export default function EditMilestone() {
  const { milId } = useLocalSearchParams<{ milId: string }>();
  const router = useRouter();
  const { selectedChildId, selectedChild, updateChild } = useChild();
  const isInitialized = useRef(false);
  
  const [name, setName] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [note, setNote] = useState("");
  
  const currentMilestone = useMemo(() => {
    return selectedChild?.milestones?.find((m: Milestone) => m.id === milId);
  }, [milId, selectedChild]);


  useEffect(() => {
    if (currentMilestone && !isInitialized.current) {
      setName(currentMilestone.name);
      
      let rawDate = currentMilestone.date;
      
      if (rawDate.includes("/") || rawDate.includes(".")) {
        rawDate = toIsoDate(rawDate);
      }
      
      if (!rawDate || rawDate.includes("undefined")) {
        rawDate = new Date().toISOString().slice(0, 10);
      }

      setDate(rawDate);
      setOriginalDate(rawDate);
      setNote(currentMilestone.note || "");
      
      // Označeno jako hotové - při dalším renderu (třeba syncu) se už nespustí
      isInitialized.current = true;
    }
  }, [currentMilestone, milId]); // milId zde pro případ navigace mezi milníky

  const handleSave = async () => {
    const finalName = name.trim();
    if (!finalName || !selectedChildId || !milId || !selectedChild || !currentMilestone) return;

    const updatedMilestoneEntry: Milestone = {
      ...currentMilestone,
      name: finalName,
      date: date,
      note: note.trim(),
    };
    
    const updatedChild: Child = {
      ...selectedChild,
      // Použijeme type assertion nebo explicitní fallback
      milestones: (selectedChild.milestones || []).map((m) => 
        m.id === milId ? updatedMilestoneEntry : m
      ),
    };

    try {
      await updateChild(updatedChild);
      router.back();
    } catch (error) {
      console.error("Chyba při ukládání milníku:", error);
      Alert.alert("Chyba", "Nepodařilo se uložit změny.");
    }
  };
  
  return (
    <MainScreenContainer>
      <CustomHeader>
      {selectedChildId ? (
        <DeleteButton 
          type="milestone" 
          childId={selectedChildId} 
          recordId={currentMilestone?.id}
          onDeleteSuccess={() => router.replace("/actions/milestone")}
        />
      ) : null}
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
            autoCapitalize="sentences"
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
              onChange={(d) => {
                if (d && d.length === 10 && !d.includes("undefined")) {
                  setDate(d);
                }
              }}
              birthISO={selectedChild?.birthDate}
              fallbackOnError="original"
              originalValue={originalDate ?? undefined}
            />
          </View>
          <DateSelector
            date={isNaN(new Date(date).getTime()) ? new Date() : new Date(date)}
            onChange={(newDate) => setDate(formatDateLocal(newDate))}
            birthISO={selectedChild?.birthDate}
          />
        </View>
        <Subtitle style={{marginTop: 10}}>Poznámka</Subtitle>
        <MyTextInput
          placeholder="Např. u babičky"
          value={note}
          onChangeText={setNote}
          autoCapitalize="sentences"
        />
        <CheckButton onPress = {handleSave} />
      </ScrollView>
    </MainScreenContainer>
  );
}