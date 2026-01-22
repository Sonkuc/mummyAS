import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import { formatDateLocal, toIsoDate } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
import * as api from "@/components/storage/api";
import { Milestone } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { useChild } from "@/contexts/ChildContext";
import { MILESTONES } from "@/data/milestones";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

export default function EditMilestone() {
  const { milId } = useLocalSearchParams<{ milId: string }>();
  const router = useRouter();
  const { selectedChildId, selectedChild, reloadChildren } = useChild();

  const [name, setName] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [note, setNote] = useState("");
  
  const currentMilestone = useMemo(() => {
    return selectedChild?.milestones?.find((m: Milestone) => m.id === milId);
  }, [milId, selectedChild]);

  useEffect(() => {
    if (currentMilestone) {
      setName(currentMilestone.name);
      
      let rawDate = currentMilestone.date;
      
      // 1. Ošetření lomítek a teček hned na startu
      if (rawDate.includes("/") || rawDate.includes(".")) {
        rawDate = toIsoDate(rawDate);
      }
      
      // 2. Kontrola validity, aby se nezobrazovalo dnešní datum
      if (!rawDate || rawDate.includes("undefined")) {
        rawDate = new Date().toISOString().slice(0, 10);
      }

      setDate(rawDate);
      setOriginalDate(rawDate);
      setNote(currentMilestone.note || "");
    }
  }, [currentMilestone]);

  const handleSave = async () => {
    const finalName = name.trim();
    if (!finalName || !selectedChildId || !milId) return;

    try {
      await api.updateMilestone(selectedChildId, milId, {
        name: finalName,
        date: date,
        note: note,
      });

      await reloadChildren();
      router.back();
    } catch (error) {
      console.error("Chyba při ukládání:", error);
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