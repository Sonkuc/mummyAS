import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";

export default function Diary() {
  const { selectedChild, updateChild } = useChild();
  const router = useRouter();

  // Stavy
  const [name, setName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [date, setDate] = useState(formatDateLocal(new Date())); 

  const handleSave = async () => {
    if (!selectedChild || !name.trim()) return;

    // Vytvoříme lokální objekt s dočasným ID
    const newRecord = {
      id: `local-${Date.now()}`, 
      child_id: selectedChild.id,
      name: name.trim(),
      text: noteText,
      date: date,
    };

    try {
      // 1. Aktualizujeme dítě v kontextu (přidáme záznam do pole diaryRecords)
      const updatedChild = {
        ...selectedChild,
        diaryRecords: [newRecord, ...(selectedChild.diaryRecords || [])]
      };
      
      await updateChild(updatedChild); 
      
      router.back();
    } catch (error) {
      console.error("Chyba při ukládání:", error);
      alert("Nepodařilo se uložit záznam.");
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Title>Přidat záznam</Title>
        <MyTextInput
          placeholder="Název"
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
        />

        <View style={{ marginTop: 10 }}>
          <Subtitle>Datum</Subtitle>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <ValidatedDateInput
                value={date}
                onChange={(d) => d && setDate(d)}
                birthISO={selectedChild ? selectedChild.birthDate : null}
              />
            </View>
            <DateSelector
              date={new Date(date.split('.').reverse().join('-'))}
              onChange={(newDate) => setDate(formatDateLocal(newDate))}
              birthISO={selectedChild ? selectedChild.birthDate : null}
            />
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Co se stalo..."
            placeholderTextColor="#999"
            value={noteText}
            onChangeText={setNoteText}
            textAlignVertical="top"
          />
        </View>

          <CheckButton onPress={handleSave} />
      </ScrollView>
      </KeyboardAvoidingView>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  textArea: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 250,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 10,
  },
});