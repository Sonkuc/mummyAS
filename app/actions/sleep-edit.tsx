import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type StoredSleepRecord = {
  date: string;
  time: string;
  state: "sleep" | "awake"; // v úložišti jen tokeny
};

type EditableRecord = StoredSleepRecord & {
  label: string; // jen pro UI, neukládá se
};

// Pomocná funkce pro číslování "spánků"
const renumberSleeps = (records: StoredSleepRecord[]): EditableRecord[] => {
  let sleepCount = 0;
  return records.map((r) => {
    if (r.state === "sleep") {
      sleepCount++;
      return { ...r, label: `${sleepCount}. spánek od` };
    }
    return { ...r, label: "Vzhůru od" };
  });
};

export default function SleepEdit() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
const { selectedChild, allChildren, selectedChildIndex, saveAllChildren, setSelectedChildIndex } = useChild();

  const [records, setRecords] = useState<EditableRecord[]>([]);

  // Načtení záznamů pro dané datum
  useEffect(() => {
    if (!selectedChild || !selectedChild.sleepRecords || typeof date !== "string") return;

    // 1) Vytáhnout záznamy daného dne
    // 2) Zkonvertovat případné staré hodnoty state (texty) na tokeny 'sleep' | 'awake'
    const dayRecords: StoredSleepRecord[] = selectedChild.sleepRecords
      .filter((r) => r.date === date)
      .map((r) => {
        let state: "sleep" | "awake";
        if (r.state === "sleep" || r.state === "awake") {
          state = r.state;
        } else {
          // fallback pro starší data, kde se ukládalo "Spánek od:" / "Vzhůru od:"
          const s = r.state.toLowerCase();
          state = s.includes("spán") ? "sleep" : "awake";
        }
        return { date: r.date, time: r.time, state };
      });

    setRecords(renumberSleeps(dayRecords));
  }, [selectedChild, date]);

  // Úprava času
  const updateTime = (index: number, newTime: string) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: newTime };
      return updated;
    });
  };

  // Smazání záznamu
  const deleteRecord = (index: number) => {
    Alert.alert("Smazat záznam?", "Opravdu chceš tento záznam smazat?", [
      { text: "Zrušit", style: "cancel" },
      {
        text: "Smazat",
        style: "destructive",
        onPress: () => {
          setRecords((prev) => {
            // odstraníme z UI label a přepočteme číslování
            const withoutDeleted: StoredSleepRecord[] = prev
              .filter((_, i) => i !== index)
              .map(({ label, ...rest }) => rest);
            return renumberSleeps(withoutDeleted);
          });
        },
      },
    ]);
  };

  // Uložení změn
  const saveChanges = () => {
    if (selectedChildIndex === null) return;
    
    const updatedChildren = [...allChildren];
    
    // Uložíme upravené záznamy
    updatedChildren[selectedChildIndex].sleepRecords = records.map(r => ({
      date: r.date,
      time: r.time,
      state: r.state,
    }));

    saveAllChildren(updatedChildren);

    if (selectedChildIndex !== null) {
      setSelectedChildIndex(selectedChildIndex); // znovu nastavíme, aby se selectedChild aktualizoval
    }

    router.back();
};

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep" />
      <Title style={{ marginTop: 40 }}>Upravit záznam</Title>
      <Subtitle style={{ textAlign: "center" }}> {date} </Subtitle>
      {records.map((rec, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.label}>{rec.label}</Text>
          <TextInput
            style={styles.input}
            value={rec.time}
            onChangeText={(txt) => updateTime(idx, txt)}
          />
          <Pressable onPress={() => deleteRecord(idx)}>
            <Text style={styles.delete}>🚮</Text>
          </Pressable>
        </View>
      ))}
      <View style={{ marginTop: 30 }}>
        <CheckButton onPress={saveChanges}/>
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  label: {
    flex: 1,
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#ccc",
    padding: 5,
    marginHorizontal: 10,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "rgb(164, 91, 143)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  delete: {
    fontSize: 20,
    color: "#bf5f82",
  },
});
