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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";

export default function DiaryEdit() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const { selectedChild, updateDiaryRecord } = useChild();
  const router = useRouter();
  
  // Mechanismus pro zabránění přepsání rozepsaných dat při syncu na pozadí
  const isInitialized = useRef(false);

  // Stavy
  const [name, setName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [date, setDate] = useState("");
  const [originalDate, setOriginalDate] = useState<string | null>(null);

  // Memo pro nalezení konkrétního záznamu
  const currentRecord = useMemo(() => {
    return selectedChild?.diaryRecords?.find((r) => r.id === diaryId);
  }, [diaryId, selectedChild]);

  // 1. Načtení existujících dat (Analogicky k Milestone)
  useEffect(() => {
    if (currentRecord && !isInitialized.current) {
      setName(currentRecord.name);
      setNoteText(currentRecord.text || "");
      setDate(currentRecord.date);
      setOriginalDate(currentRecord.date);
      
      isInitialized.current = true;
    } else if (!currentRecord && !isInitialized.current && selectedChild) {
      // Pokud záznam neexistuje (např. byl smazán v jiném okně)
      Alert.alert("Chyba", "Záznam nebyl nalezen.");
      router.back();
    }
  }, [currentRecord, selectedChild]);

  const handleUpdate = async () => {
    const finalName = name.trim();
    if (!selectedChild || !finalName || !diaryId || !currentRecord) return;

    try {
      await updateDiaryRecord(selectedChild.id, diaryId, {
        name: finalName,
        text: noteText.trim(),
        date: date,
      });
      
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Chyba", "Nepodařilo se uložit změny.");
    }
  };

  if (!date) return null;

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
                  fallbackOnError="original"
                  originalValue={originalDate ?? undefined}
                />
              </View>
              <DateSelector
                date={isNaN(new Date(date).getTime()) ? new Date() : new Date(date)}
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