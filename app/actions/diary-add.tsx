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
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";

export default function DiaryAdd() {
  const router = useRouter();
  const { selectedChildId, selectedChild, addDiaryRecord } = useChild();

  // Stavy
  const [name, setName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    const finalName = name.trim();
    
    // 1. Validace
    if (!finalName) {
      Alert.alert("Chybí název", "Prosím zadejte název záznamu.");
      return;
    }
    if (!selectedChildId || !selectedChild) return;

    try {
      setIsSubmitting(true);

      const diaryData = {
        name: finalName,
        text: noteText.trim() || undefined,
        date: date,
      };

      await addDiaryRecord(selectedChildId, diaryData);

      router.back();
    } catch (error) {
      console.error("Chyba při ukládání deníku:", error);
      Alert.alert("Chyba", "Nepodařilo se uložit záznam. Zkuste to prosím znovu.");
    } finally {
      setIsSubmitting(false);
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
          
          <View style={{ marginTop: 10 }}>
            <MyTextInput
              placeholder="Název"
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
            />
            <Subtitle>Datum</Subtitle>
          </View>

          {/* Datum řádek - sjednoceno s Milestone */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ width: "80%" }}>
              <ValidatedDateInput
                value={date}
                onChange={(d) => d && setDate(d)}
                birthISO={selectedChild?.birthDate}
              />
            </View>
            <DateSelector
              // Opraveno parsování data, aby bylo konzistentní s Milestone
              date={isNaN(new Date(date).getTime()) ? new Date() : new Date(date)}
              onChange={(newDate) => setDate(formatDateLocal(newDate))}
              birthISO={selectedChild?.birthDate}
            />
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

          <CheckButton 
            onPress={handleSave}
            disabled={isSubmitting}
          />
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