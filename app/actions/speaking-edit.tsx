import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import GroupSection from "@/components/GroupSection";
import { formatDateLocal, formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import { Child } from "@/components/storage/interfaces";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SpeakingEdit() {
  const { wordId } = useLocalSearchParams();
  const router = useRouter();
  const { selectedChildId, selectedChild, updateChild } = useChild();

  const [name, setName] = useState("");
  const [entries, setEntries] = useState<{ id?: string; date: string; note?: string }[]>([]);
  const [newDate, setDate] = useState(formatDateLocal(new Date()));
  const [newNote, setNewNote] = useState("");

  const currentWord = selectedChild?.words?.find((w: any) => w.id === wordId);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!currentWord) return;

    if (!isInitialized.current) {
      setName(currentWord.name);
      setEntries(currentWord.entries ?? []);
      isInitialized.current = true;
    }
  }, [currentWord?.id, wordId]);

  const handleSave = async () => {
    if (!selectedChildId || !wordId || !selectedChild) return;

    // 1. Nová verze slova (aktualizované jméno a pole záznamů)
    const updatedWord = {
      ...currentWord,
      name: name.trim(),
      entries: entries.map(e => ({
        id: e.id,
        date: e.date,
        note: e.note?.trim() || ""
      })),
    };

    // 2. Vytvoříme kopii celého dítěte, kde v poli 'words' vyměníme to jedno slovo
    const updatedChild: Child = {
      ...selectedChild,
      words: selectedChild.words?.map((w: any) => 
        w.id === wordId ? updatedWord : w
      ) || [],
    };

    try {
      await updateChild(updatedChild);
      
      router.back();
    } catch (error) {
      console.error("Chyba při ukládání:", error);
      Alert.alert("Chyba", "Nepodařilo se uložit změny.");
    }
  };

  const removeEntry = (entryToRemove: { id?: string; date: string; note?: string }) => {
    setEntries(prev => prev.filter(e => {
      // Pokud máme ID (z API nebo čerstvě vygenerované)
      if (e.id && entryToRemove.id) {
        return e.id !== entryToRemove.id;
      }
      // Fallback pro jistotu (shoda data a poznámky)
      return !(e.date === entryToRemove.date && e.note === entryToRemove.note);
    }));
  };

  const addEntry = () => {
    if (!newDate.trim()) return;
    
    // Přidáváme unikátní ID pro každé entry
    setEntries(prev => [...prev, { 
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      date: newDate, 
      note: newNote 
    }]);
  
    setDate(formatDateLocal(new Date()));
    setNewNote("");
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/speaking" onPress={handleSave}>
        {selectedChildId ? (
          <DeleteButton 
            type="word" 
            childId={selectedChildId} 
            recordId={wordId as string}
            onDeleteSuccess={() => router.replace("/actions/speaking")}
          />
        ) : null}
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>{name}</Title>
        {sortedEntries.map((entry, index) => (
          <GroupSection key={`${entry.date}-${index}`} style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryText}>Datum: {formatDateToCzech(entry.date)}</Text>
              <Text style={styles.entryText}>Poznámka: {entry.note}</Text>
            </View>
            <TouchableOpacity onPress={() => removeEntry(entry)}>
              <Text style={styles.delete}>🚮</Text>
            </TouchableOpacity>
          </GroupSection>
        ))}
        <GroupSection>
          <Text style={styles.entryLabel}>Datum</Text>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <ValidatedDateInput
                value={newDate}
                onChange={(d) => d && setDate(d)}
                birthISO={selectedChild ? selectedChild.birthDate : null}
              />
            </View>
            <DateSelector
              date={new Date(newDate)}
              onChange={(newDate) => setDate(formatDateLocal(newDate))}
              birthISO={selectedChild ? selectedChild.birthDate : null}
            />
          </View>

          <Text style={styles.entryLabel}>Pokrok ve výslovnosti</Text>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <MyTextInput
                placeholder="Např. Aoj"
                value={newNote}
                onChangeText={setNewNote}
                autoCapitalize="sentences"
              />
            </View>
          </View>
          <Pressable style={styles.iconButton} onPress={addEntry}>
            <Plus size={24} color="white" />
          </Pressable>
        </GroupSection>
      </ScrollView>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  entryText: {
    fontSize: 16,
  },
  delete: {
    fontSize: 20,
  },
  entryLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignSelf: "center",
		width: 40,
		height: 35,
  },
});