import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { MILESTONES } from "@/data/milestones";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function Progress() {
  const [name, setName] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const handleAdd = () => {
    const finalName =
      name.trim() !== ""
        ? name
        : MILESTONES.find(m => m.id === selectedMilestone)?.label || "";

    console.log("Přidávám pokrok:", {
      name: finalName,
      date,
      note,
    });

    setName("");
    setSelectedMilestone("");
    setNote(""); // vyčistí poznámku po odeslání
  };


  return (
    <MainScreenContainer>
      <View style={{ marginBottom: -25 }}>
        <CustomHeader />
      </View>
      <Title>Přidat milník</Title>
      <MyTextInput
        placeholder="Např. První úsměv"
        value={name}
        onChangeText={text => {
          setName(text);
          setSelectedMilestone(""); // zruší výběr z pickeru, pokud píšu vlastní text
        }}
      />
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedMilestone}
          onValueChange={value => {
            setSelectedMilestone(value);
            const selectedLabel = MILESTONES.find(m => m.id === value)?.label;
            if (selectedLabel) setName(selectedLabel); // vyplní input podle výběru
          }}
          style={styles.input}
        >
          <Picker.Item label="Vyber milník z nabídky..." value="" enabled={false} />
          {MILESTONES.map(m => (
            <Picker.Item key={m.id} label={m.label} value={m.id} />
          ))}
        </Picker>
      </View>

      <Subtitle>Datum</Subtitle>
      <MyTextInput
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
      />

      <Subtitle>Poznámka</Subtitle>
      <MyTextInput
              placeholder="Např. u babičky"
              value={note}
              onChangeText={setNote}
      />
      <CheckButton onPress = {handleAdd} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
   input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },
  label: {
    fontWeight: "500",
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: "#bf5f82", 
    borderRadius: 10,
    marginVertical: 10,
    overflow: "hidden", // zaoblí rohy i uvnitř
  },
});