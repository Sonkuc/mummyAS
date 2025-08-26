import CustomHeader from "@/components/CustomHeader";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
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
  const { selectedChild, allChildren, selectedChildIndex, saveAllChildren, setSelectedChild } = useChild();

  const [records, setRecords] = useState<EditableRecord[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newState, setNewState] = useState<"sleep" | "awake">("sleep");

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
          const s = String(r.state).toLowerCase();
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

  const addRecord = () => {
    if (!newTime) {
      Alert.alert("Chybí čas", "Zadej čas ve formátu HH:MM");
      return;
    }

    const newRec: StoredSleepRecord = {
      date: date!,
      time: newTime,
      state: newState,
    };

    setRecords((prev) => {
      const withoutLabels: StoredSleepRecord[] = prev.map(({ label, ...rest }) => rest);
      return renumberSleeps([...withoutLabels, newRec]);
    });

    // vyčistit input
    setNewTime("");
  };


  // Uložení změn
  const saveChanges = () => {
    if (selectedChildIndex === null) return;
    
    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];

    // všechny ostatní dny necháme být
    const otherDays = (child.sleepRecords || []).filter(r => r.date !== date);
    
    // Uložíme upravené záznamy
    const newRecords = records.map(r => ({
      date: r.date,
      time: r.time,
      state: r.state,
    }));
  
    child.sleepRecords = [...otherDays, ...newRecords];

    saveAllChildren(updatedChildren);
    setSelectedChild(updatedChildren[selectedChildIndex]);
    router.back();
};

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep" />
      <Title>Upravit záznam</Title>
      <Subtitle style={{ textAlign: "center" }}> {date} </Subtitle>
      {records.map((rec, idx) => (
        <GroupSection key={idx} style={styles.row}>
          <Text style={styles.label}>{rec.label}</Text>
          <TextInput
            style={styles.input}
            value={rec.time}
            onChangeText={(txt) => updateTime(idx, txt)}
          />
          <Pressable onPress={() => deleteRecord(idx)}>
            <Text style={styles.delete}>🚮</Text>
          </Pressable>
        </GroupSection>
      ))}
      <GroupSection style={styles.row}>
        <View style={[styles.switchRow, { flex: 1 }]}>
          <Pressable
            style={[styles.switchBtn, newState === "sleep" && styles.switchBtnActive]}
            onPress={() => setNewState("sleep")}
          >
            <Text style={newState === "sleep" ? styles.switchTextActive : styles.switchText}>
              Spánek od
            </Text>
          </Pressable>
          <Pressable
            style={[styles.switchBtn, newState === "awake" && styles.switchBtnActive]}
            onPress={() => setNewState("awake")}
          >
            <Text style={newState === "awake" ? styles.switchTextActive : styles.switchText}>
              Vzhůru od
            </Text>
          </Pressable>
        </View>
        <TextInput
            placeholder="HH:MM"
            style={styles.input}
            value={newTime}
            onChangeText={setNewTime}
          />
       
        <Pressable onPress={addRecord}>
          <Text style={styles.add}>✅</Text>
        </Pressable>
      </GroupSection>
      <View style={{ marginTop: 30 }}>
        <MyButton title="Uložit" onPress={saveChanges}/>
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
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
    marginHorizontal: 30,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "rgb(164, 91, 143)",
    padding: 5,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  delete: {
    fontSize: 20,
  },
  add: {
    fontSize: 20,
  },
  switchRow: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#ccc",
    maxWidth: 200,
    width: "90%",
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
