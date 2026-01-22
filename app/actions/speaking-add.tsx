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
  const { selectedChildId, selectedChild, reloadChildren } = useChild();
  
  const handleAdd = async () => {
    let finalName = name.trim();
    if (!selectedChildId) {
      Alert.alert("Chyba", "Není vybráno dítě.");
      return;
    }

    if (!finalName) {
      Alert.alert("Chyba", "Zadej nebo vyber slovo.");
      return;
    }

    const existingWords = selectedChild?.words || [];
    const nameExists = existingWords.some(
      (w: any) => w.name.toLowerCase() === finalName.toLowerCase()
    );

    if (nameExists) {
      Alert.alert("Info", "Toto slovo už v seznamu existuje.");
      return;
    }

  try {
    // 1. Odeslání dat na server
    const payload = {
      name: finalName,
      entries: [
        {
          date: date,
          // Pokud je note prázdný, pošli raději null nebo ho vynech, 
          // pokud ho backend nevyžaduje jako string
          note: note.trim() || "" 
        },
      ],
    };

    await api.createWord(selectedChildId, payload);

    // 2. Refresh globálních dat v kontextu
    await reloadChildren();
    router.back();
      } catch (error) {
        console.error("Chyba při ukládání slova:", error);
        Alert.alert("Chyba", "Nepodařilo se uložit slovo.");
      }
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
            autoCapitalize="sentences"
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
          autoCapitalize="sentences"
        />
        <CheckButton onPress = {handleAdd} />
      </ScrollView>
    </MainScreenContainer>
  );
}