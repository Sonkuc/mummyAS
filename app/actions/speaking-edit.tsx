import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SpeakingEdit() {
  const { wordIndex } = useLocalSearchParams();
  const router = useRouter();
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();

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

  return (
    <MainScreenContainer>
      <View style={{ marginBottom: -25 }}>
        <CustomHeader>
          {selectedChildIndex !== null && wordIndex !== undefined && (
            <DeleteButton type="word" index={Number(wordIndex)} 
            onDeleteSuccess={() => router.replace("/actions/speaking")}/>
          )}
        </CustomHeader>
      </View>
      <Title>Upravit: {name}</Title>

       {entries.map((entry, index) => (
        <View key={index} style={styles.entryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.entryText}>Datum: {formatDate(entry.date)}</Text>
            <Text style={styles.entryText}>Poznámka: {entry.note}</Text>
          </View>
          <TouchableOpacity onPress={() => removeEntry(index)}>
            <Text style={styles.delete}>🚮</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Subtitle>Datum</Subtitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
        <View style={{ width: "80%" }}>
          <MyTextInput
            placeholder="YYYY-MM-DD"
            value={newDate}
            onChangeText={setDate}
          />
        </View>
        <DateSelector
          date={new Date(newDate)}
          onChange={(newDate) => setDate(newDate.toISOString().slice(0, 10))}
        />
      </View>
      <Subtitle>Výslovnost</Subtitle>
      <MyTextInput
              placeholder="Např. Aoj"
              value={newNote}
              onChangeText={setNewNote}
      />
      <TouchableOpacity onPress={addEntry} style={styles.addButton}>
        <Text style={styles.addButtonText}>Přidat</Text>
      </TouchableOpacity>
      <CheckButton onPress = {handleSave} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0e6eb",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  entryText: {
    color: "#993769",
    fontSize: 16,
  },
  delete: {
    fontSize: 20,
    color: "#bf5f82",
  },
  addButton: {
    backgroundColor: "#bf5f82",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
  },
});