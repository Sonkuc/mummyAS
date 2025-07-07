import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
import { Word } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { WORDS } from "@/data/words";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function SpeakingAdd() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedWord, setSelectedWord] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  
  const handleAdd = () => {
    const finalName = name.trim() !== "" 
      ? name.trim() 
      : selectedWord.trim();

    if (!finalName) {
      Alert.alert("Chyba", "Zadej nebo vyber slovo.");
      return;
    }

    if (selectedChildIndex === null) return;

    const child = allChildren[selectedChildIndex];
    const existingWords = child.words || [];

    // DUPLICITNÍ KONTROLA (case insensitive)
    const nameExists = existingWords.some(
      (word) => word.name.toLowerCase() === finalName.toLowerCase()
    );

    if (nameExists) {
      Alert.alert("Toto slovo už existuje.");
      return;
    }

    const newWord: Word = {
      name: finalName,
      entries: [
        {
          date,
          note,
        },
      ],
    };

    const updatedChildren = [...allChildren];
    updatedChildren[selectedChildIndex].words = [...existingWords, newWord];

    saveAllChildren(updatedChildren);

    router.replace("/actions/speaking");
  };

   return (
    <MainScreenContainer>
      <View style={{ marginBottom: -25 }}>
        <CustomHeader />
      </View>
      <Title>Přidat slovo</Title>
      <MyTextInput
        placeholder="Např. Ahoj"
        value={name}
        onChangeText={text => {
          setName(text);
          setSelectedWord(""); // zruší výběr z pickeru, pokud píšu vlastní text
        }}
      />
      <MyPicker
        data={WORDS.map((w, index) => ({ id: `${w.label}-${index}`, label: w.label }))}
        selectedValue={selectedWord}
        onChange={setSelectedWord}
        setName={setName}
      />
      <Subtitle>Datum</Subtitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
        <View style={{ width: "80%" }}>
          <MyTextInput
                  placeholder="YYYY-MM-DD"
                  value={date}
                  onChangeText={setDate}
          />
        </View>
        <DateSelector
          date={new Date(date)}
          onChange={(newDate) => setDate(newDate.toISOString().slice(0, 10))}
        />
      </View>
      <Subtitle>Výslovnost</Subtitle>
      <MyTextInput
              placeholder="Např. Oj"
              value={note}
              onChangeText={setNote}
      />
      <CheckButton onPress = {handleAdd} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "500",
  },
});