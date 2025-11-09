import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyPicker from "@/components/MyPicker";
import MyTextInput from "@/components/MyTextInput";
import { Word } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { useChild } from "@/contexts/ChildContext";
import { WORDS } from "@/data/words";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

export default function SpeakingAdd() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedWord, setSelectedWord] = useState("");
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [note, setNote] = useState("");
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();

  const selectedChild =
  selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;
  
  const handleAdd = () => {
    const finalName = (name || selectedWord).trim();

    if (!finalName) {
      Alert.alert("Chyba", "Zadej nebo vyber slovo.");
      return;
    }

    if (selectedChildIndex === null) return;

    const child = allChildren[selectedChildIndex];
    const existingWords = child.words || [];

    // DUPLICITNÍ KONTROLA (case insensitive)
    const nameExists = existingWords.some(
      (w) => w.name.toLowerCase() === finalName.toLowerCase()
    );
    if (nameExists) return Alert.alert("Toto slovo už existuje.");

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

    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader/>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Přidat slovo</Title>
        <View style={{marginTop: 10}}>
          <MyTextInput
            placeholder="Např. Ahoj"
            value={name}
            onChangeText={text => {                
              setName(text);
              setSelectedWord(""); // zruší výběr z pickeru v případě vlastního textu
            }}
          />
          <MyPicker
            data={WORDS.map((w, index) => ({ id: `${w.label}-${index}`, label: w.label }))}
            selectedValue={selectedWord}
            onChange={setSelectedWord}
            setName={setName}
          />
          <Subtitle>Datum</Subtitle>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ width: "80%" }}>
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
        <Subtitle style={{marginTop: 10}}>Výslovnost</Subtitle>
        <MyTextInput
          placeholder="Např. Oj"
          value={note}
          onChangeText={setNote}
        />
        <CheckButton onPress = {handleAdd} />
      </ScrollView>
    </MainScreenContainer>
  );
}