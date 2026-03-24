import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";

export default function DiaryEdit() {
  const { diaryId } = useLocalSearchParams(); 
  const { selectedChild, updateChild } = useChild();
  const router = useRouter();

  // Stavy
  const [name, setName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [date, setDate] = useState("");

  // 1. Načtení existujících dat při mountu
  useEffect(() => {
  if (selectedChild && diaryId) {
    const record = selectedChild.diaryRecords?.find((r) => r.id === diaryId);
    
    if (record) {
      setName(record.name);
      setNoteText(record.text || "");
      setDate(record.date);
    } else {
      if (!name) {
        Alert.alert("Chyba", "Záznam nebyl nalezen.");
        router.back();
      }
    }
  }
}, [diaryId, selectedChild]);

  const handleUpdate = async () => {
    if (!selectedChild || !name.trim() || !diaryId) return;

    // Vytvoříme aktualizovaný objekt záznamu
    const updatedRecord = {
      id: diaryId as string,
      child_id: selectedChild.id,
      name: name.trim(),
      text: noteText,
      date: date,
    };

    try {
      // 2. Mapujeme pole a nahradíme starý záznam novým
      const updatedDiaryRecords = (selectedChild.diaryRecords || []).map((r) =>
        r.id === diaryId ? updatedRecord : r
      );

      const updatedChild = {
        ...selectedChild,
        diaryRecords: updatedDiaryRecords,
      };

      await updateChild(updatedChild);
      router.back();
    } catch (error) {
      console.error("Chyba při aktualizaci:", error);
      Alert.alert("Chyba", "Nepodařilo se upravit záznam.");
    }
  };

  if (!date) return null; // Prevence renderu před načtením dat

  return (
    <MainScreenContainer>
      <CustomHeader>
        {selectedChild ? (
          <DeleteButton 
            type="diary" 
            childId={selectedChild.id} 
            recordId={diaryId as string}
            onDeleteSuccess={() => router.replace("/actions/diary")}
          />
        ) : null}
      </CustomHeader>        
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Title>Upravit záznam</Title>
          
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
                date={new Date(date)}
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

          <CheckButton onPress={handleUpdate} />
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
    gap: 10,
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