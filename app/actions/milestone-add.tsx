import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
import * as api from "@/components/storage/api";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { useChild } from "@/contexts/ChildContext";
import { MILESTONES } from "@/data/milestones";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";

export default function AddMilestone() {
  const router = useRouter();
  const { selectedChildId, selectedChild, reloadChildren } = useChild();
  
  const [name, setName] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [note, setNote] = useState("");

  const handleAdd = async () => {
    let finalName = name.trim();
    if (!finalName || !selectedChildId) return; 

    try {
      // 1. Odeslání dat na server
      await api.createMilestone(selectedChildId, {
        name: finalName,
        date: date, // Posíláme YYYY-MM-DD
        note: note,
      });

      // 2. Refresh globálních dat v kontextu
      await reloadChildren();

      router.back();
    } catch (error) {
      console.error("Chyba při ukládání milníku:", error);
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Přidat milník</Title>
        
        <View style={{ marginTop: 10 }}>
          <MyTextInput
            placeholder="Např. První úsměv"
            value={name}
            onChangeText={(text) => {
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

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ width: "80%" }}>
            <ValidatedDateInput
              value={date}
              onChange={(d) => d && setDate(d)}
              birthISO={selectedChild?.birthDate}
            />
          </View>
          <DateSelector
            date={new Date(date)}
            onChange={(newDate) => setDate(formatDateLocal(newDate))}
            birthISO={selectedChild?.birthDate}
          />
        </View>

        <Subtitle style={{ marginTop: 10 }}>Poznámka</Subtitle>
        <MyTextInput
          placeholder="Např. u babičky"
          value={note}
          onChangeText={setNote}
          autoCapitalize="sentences"
        />  
        
        <CheckButton onPress={handleAdd} />
      </ScrollView>
    </MainScreenContainer>
  );
}