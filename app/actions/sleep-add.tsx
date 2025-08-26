import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type StoredSleepRecord = {
  date: string;
  time: string;
  state: "sleep" | "awake";
};

type EditableRecord = StoredSleepRecord & {
  label: string;
};

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

export default function SleepAdd() {
  const router = useRouter();
  const { selectedChild, allChildren, selectedChildIndex, saveAllChildren, setSelectedChild } = useChild();

  const [records, setRecords] = useState<EditableRecord[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newState, setNewState] = useState<"sleep" | "awake">("sleep");
  const [newDate, setNewDate] = useState("");

  // ✅ Načíst existující záznamy pro datum
  useEffect(() => {
    if (!selectedChild) return;
    if (!newDate) return;

    const todaysRecords = (selectedChild.sleepRecords || [])
      .filter((r) => r.date === newDate)
      .sort((a, b) => a.time.localeCompare(b.time));

    setRecords(renumberSleeps(todaysRecords));
  }, [selectedChild, newDate]);

  // ✅ Přidání záznamu s validací
  const addRecord = () => {
    if (!newTime) {
      Alert.alert("Chybí čas", "Zadej čas ve formátu HH:MM");
      return;
    }

    const newRec: StoredSleepRecord = {
      date: newDate,
      time: newTime,
      state: newState,
    };

    // Bez labelů
    const currentRecords = records.map(({ label, ...rest }) => rest);

    // ✅ Přidat nový záznam, seřadit podle času
    const updated = [...currentRecords, newRec].sort((a, b) => a.time.localeCompare(b.time));

    // ✅ Validace: nesmí být 2x stejný stav za sebou
    for (let i = 1; i < updated.length; i++) {
      if (updated[i].state === updated[i - 1].state) {
        Alert.alert("Neplatná posloupnost", "Nemohou být dva stejné stavy po sobě.");
        return;
      }
    }

    // ✅ Očíslovat spánky a nastavit
    setRecords(renumberSleeps(updated));
    setNewTime("");
  };

  // ✅ Smazání záznamu
  const deleteRecord = (index: number) => {
    Alert.alert("Smazat záznam?", "Opravdu chceš tento záznam smazat?", [
      { text: "Zrušit", style: "cancel" },
      {
        text: "Smazat",
        style: "destructive",
        onPress: () => {
          const withoutDeleted: StoredSleepRecord[] = records
            .filter((_, i) => i !== index)
            .map(({ label, ...rest }) => rest);

          setRecords(renumberSleeps(withoutDeleted));
        },
      },
    ]);
  };

  // ✅ Uložení změn do kontextu
  const saveChanges = () => {
    if (selectedChildIndex === null) return;

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];

    const otherDays = (child.sleepRecords || []).filter((r) => r.date !== newDate);

    const newRecords = records.map(({ label, ...rest }) => rest);

    child.sleepRecords = [...otherDays, ...newRecords];

    saveAllChildren(updatedChildren);
    setSelectedChild(updatedChildren[selectedChildIndex]);
    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep" />
      <Title>Přidat záznam</Title>
      <Subtitle>Datum</Subtitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
        <View style={{ width: "80%" }}>
          <MyTextInput placeholder="YYYY-MM-DD" value={newDate} onChangeText={setNewDate} />
        </View>
        <DateSelector
          date={newDate ? new Date(newDate) : new Date()}
          onChange={(date) => setNewDate(date.toISOString().slice(0, 10))}
        />
      </View>

      <GroupSection style={styles.row}>
        <View style={[styles.switchRow]}>
          <Pressable
            style={[styles.switchBtn, newState === "sleep" && styles.switchBtnActive]}
            onPress={() => setNewState("sleep")}
          >
            <Text style={newState === "sleep" ? styles.switchTextActive : styles.switchText}>Spánek od</Text>
          </Pressable>
          <Pressable
            style={[styles.switchBtn, newState === "awake" && styles.switchBtnActive]}
            onPress={() => setNewState("awake")}
          >
            <Text style={newState === "awake" ? styles.switchTextActive : styles.switchText}>Vzhůru od</Text>
          </Pressable>
        </View>
        <TextInput placeholder="HH:MM" style={styles.input} value={newTime} onChangeText={setNewTime} />
        <Pressable onPress={addRecord}>
          <Text style={styles.add}>✅</Text>
        </Pressable>
      </GroupSection>

      {/* ✅ Výpis záznamů */}
      {records.map((r, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
          <Text style={{ flex: 1 }}>
            {r.label} {r.time}
          </Text>
          <Pressable onPress={() => deleteRecord(i)}>
            <Text style={{ fontSize: 18 }}>🗑️</Text>
          </Pressable>
        </View>
      ))}

      <View style={{ marginTop: 30 }}>
        <MyButton title="Uložit" onPress={saveChanges} />
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#ccc",
    padding: 5,
    marginHorizontal: 20,
    textAlign: "center",
  },
  add: {
    fontSize: 22,
  },
  switchRow: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#ccc",
    maxWidth: 200,
    flex: 1,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  switchBtnActive: {
    backgroundColor: "#993769",
  },
  switchText: {
    color: "#333",
    fontSize: 14,
  },
  switchTextActive: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
