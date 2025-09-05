import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import MyTextInput from "@/components/MyTextInput";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SpeakingEdit() {
  const { wordIndex } = useLocalSearchParams();
  const router = useRouter();
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  const selectedChild =
    selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;

  const [name, setName] = useState("");
  const [entries, setEntries] = useState<{ date: string; note: string }[]>([]);
  const [newDate, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [newNote, setNewNote] = useState("");

  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    if (
      selectedChildIndex !== null &&
      wordIndex !== undefined &&
      allChildren[selectedChildIndex]?.words
    ) {
      const idx = Number(wordIndex);
      const word = allChildren[selectedChildIndex].words[idx];
      if (word) {
        setName(word.name);
        setEntries(word.entries ?? []);
      }
    }
  }, [wordIndex, selectedChildIndex, allChildren]);

  const handleSave = () => {
    if (selectedChildIndex === null || wordIndex === undefined) return;
    
    const updatedWord = {
      name: name.trim(),
      entries: entries.filter(e => e.date.trim() !== ""),
    };

  const updatedChildren = [...allChildren];
    const idx = Number(wordIndex);
    updatedChildren[selectedChildIndex].words[idx] = updatedWord;
    saveAllChildren(updatedChildren);
    router.back();
  };

    const handleDeleteWord = () => {
    if (selectedChildIndex === null || wordIndex === undefined) return;

    const updatedChildren = [...allChildren];
    updatedChildren[selectedChildIndex].words.splice(Number(wordIndex), 1);
    saveAllChildren(updatedChildren);
    router.replace("/actions/speaking");
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const addEntry = () => {
    if (newDate.trim() === "" && newNote.trim() === "") return;
    setEntries(prev => [...prev, { date: newDate, note: newNote }]);
    setDate(new Date().toISOString().slice(0, 10));
    setNewNote("");
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <MainScreenContainer>
      <CustomHeader>
        {selectedChildIndex !== null && wordIndex !== undefined && (
          <DeleteButton type="word" index={Number(wordIndex)} 
          onDeleteSuccess={() => router.replace("/actions/speaking")}/>
        )}
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <Title>{name}</Title>
      {sortedEntries.map((entry, index) => (
        <GroupSection key={index} style={{ flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.entryText}>Datum: {formatDate(entry.date)}</Text>
            <Text style={styles.entryText}>Poznámka: {entry.note}</Text>
          </View>
          <TouchableOpacity onPress={() => removeEntry(index)}>
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
              onChange={setDate}
              birthISO={selectedChild ? selectedChild.birthDate : null}
            />
          </View>
          <DateSelector
            date={new Date(newDate)}
            onChange={(newDate) => setDate(newDate.toISOString().slice(0, 10))}
          />
        </View>

        <Text style={styles.entryLabel}>Výslovnost</Text>
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <MyTextInput
              placeholder="Např. Aoj"
              value={newNote}
              onChangeText={setNewNote}
            />
          </View>
        </View>
        <Pressable style={styles.iconButton} onPress={addEntry}>
          <Plus size={24} color="#fff" />
        </Pressable>
      </GroupSection>
      <View style={{ marginTop: 30 }}>
        <MyButton title="Uložit" onPress = {handleSave} />
      </View>
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
    color: "#bf5f82",
  },
  entryLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    backgroundColor: "#993769",
    padding: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignSelf: "center",
		width: 40,
		height: 35,
  },
});