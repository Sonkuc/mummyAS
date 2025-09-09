import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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
  const { selectedChild, allChildren, selectedChildIndex, saveAllChildren, setSelectedChild } =
    useChild();

  const today = new Date().toISOString().slice(0, 10);
  const [newDate, setNewDate] = useState(today);
  const [records, setRecords] = useState<EditableRecord[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newState, setNewState] = useState<"sleep" | "awake">("awake");
  const [errorMessage, setErrorMessage] = useState("");


  const checkDuplicateDate = (date: string) => {
    if (!selectedChild) return false;

    const exists = (selectedChild.sleepRecords || []).some(r => r.date === date);
    if (exists) {
      setErrorMessage("Pro tento den už existují záznamy. Otevři je v režimu úprav.");
      setRecords([]);
      return true;
    }

    setErrorMessage("");
    return false;
  };

  // povolíme jen čísla a 1 dvojtečku, max délka 5
  const handleTimeInput = (txt: string, set: (v: string) => void) => {
    let t = txt.replace(/[^\d:]/g, "");               // jen 0-9 a :
    const firstColon = t.indexOf(":");                 // jen první dvojtečka
    if (firstColon !== -1) {
      t = t.slice(0, firstColon + 1) + t.slice(firstColon + 1).replace(/:/g, "");
    } else {
      t = t.replace(/:/g, "");
    }
    if (t.length > 5) t = t.slice(0, 5);              // HH:MM
    set(t);
  };

  const normalizeTime = (input: string): string | null => {
    if (!input) return null;
    const m = input.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
  };


  // Při načtení stránky zkontrolujeme dnešní datum
  useEffect(() => {
    checkDuplicateDate(today);
  }, [selectedChild]);

  // Při změně data
  const handleDateChange = (d: Date) => {
    const formatted = d.toISOString().slice(0, 10);
    setNewDate(formatted);
    const isInvalid = checkDuplicateDate(formatted);

    if (isInvalid || !selectedChild) return;

    setRecords([]);
    setNewTime(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));
    setNewState("awake");
  };

  const updateTime = (index: number, newTime: string) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: newTime };
      return updated;
    });
  };

  const deleteRecord = (index: number) => {
    Alert.alert("Smazat záznam?", "Opravdu chceš tento záznam smazat?", [
      { text: "Zrušit", style: "cancel" },
      {
        text: "Smazat",
        style: "destructive",
        onPress: () => {
          setRecords((prev) => {
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
    if (errorMessage) {
      Alert.alert("Chyba", errorMessage);
      return;
    }

    const norm = normalizeTime(newTime);
    if (!norm) {
      Alert.alert("Chybný čas", "Zadej čas ve formátu HH:MM (0–23 h, 0–59 min).");
      return;
    }

    const newRec: StoredSleepRecord = { date: newDate, time: norm, state: newState };

    const withoutLabels: StoredSleepRecord[] = records.map(({ label, ...rest }) => rest);
    const allRecords = [...withoutLabels, newRec].sort((a, b) => a.time.localeCompare(b.time));
    setRecords(renumberSleeps(allRecords));

    const now = new Date();
    setNewTime(now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));
    const last = allRecords[allRecords.length - 1];
    setNewState(last.state === "sleep" ? "awake" : "sleep");
  };

  const saveChanges = () => {
    if (selectedChildIndex === null) return;

    if (errorMessage) {
      Alert.alert("Chyba", errorMessage);
      return;
    }

    // znormalizujeme a ověříme všechny časy
    const normalized: StoredSleepRecord[] = [];
    for (const rec of records) {
      const norm = normalizeTime(rec.time);
      if (!norm) {
        Alert.alert("Chybný čas", "Některý z časů není ve formátu HH:MM nebo je mimo rozsah.");
        return;
      }
      normalized.push({ date: rec.date, time: norm, state: rec.state });
    }

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];

    // proti–duplicitní kontrola dne
    const existingForDay = (child.sleepRecords || []).some(r => r.date === newDate);
    if (existingForDay) {
      Alert.alert("Duplicitní den", "Pro tento den už existují záznamy. Otevři je v režimu úprav.");
      return;
    }

    const otherDays = (child.sleepRecords || []).filter((r) => r.date !== newDate);
    child.sleepRecords = [...otherDays, ...normalized];

    saveAllChildren(updatedChildren);
    setSelectedChild(updatedChildren[selectedChildIndex]);
    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Přidat záznam</Title>
        <Subtitle>Datum</Subtitle>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
          <View style={{ width: "80%" }}>
            <ValidatedDateInput
              value={newDate}
              onChange={setNewDate}
              birthISO={selectedChild ? selectedChild.birthDate : null}
            />
          </View>
          <DateSelector
            date={new Date(newDate)}
            onChange={handleDateChange}
          />
        </View>
        {errorMessage ? (
          <Text style={{ color: "red", marginTop: 5 }}>{errorMessage}</Text>
        ) : null}

        <GroupSection style={[styles.row, { marginBottom: 30}]}>
          <View style={[styles.switchRow, { flex: 1}]}>
            <Pressable
              style={[styles.switchBtn, newState === "awake" && styles.switchBtnActive]}
              onPress={() => setNewState("awake")}
            >
              <Text style={newState === "awake" ? styles.switchTextActive : styles.switchText}>
                Vzhůru od
              </Text>
            </Pressable>
            <Pressable
              style={[styles.switchBtn, newState === "sleep" && styles.switchBtnActive]}
              onPress={() => setNewState("sleep")}
            >
              <Text style={newState === "sleep" ? styles.switchTextActive : styles.switchText}>
                Spánek od
              </Text>
            </Pressable>
            
          </View>
          <TextInput 
            placeholder="HH:MM" 
            style={styles.input} 
            value={newTime} 
            onChangeText={(txt) => handleTimeInput(txt, setNewTime)}
            onBlur={() => {
              const norm = normalizeTime(newTime);
              if (norm) setNewTime(norm);
              else {
                Alert.alert("Chybný čas", "Zadej čas ve formátu HH:MM (0–23 h, 0–59 min).");
                setNewTime("");
              }
            }}
          />
          <Pressable onPress={addRecord}>
            <Text style={styles.icon}>✅</Text>
          </Pressable>
        </GroupSection>

        {records.map((r, i) => (
          <GroupSection key={i} style={styles.row}>
            <Text style={{ flex: 1 }}>{r.label}</Text>
            <TextInput
              style={styles.input}
              value={r.time}
              onChangeText={(txt) => handleTimeInput(txt, (t) => updateTime(i, t))}
              onBlur={() => {
                const norm = normalizeTime(records[i].time);
                if (norm) updateTime(i, norm);
                else {
                  Alert.alert("Chybný čas", "Zadej čas ve formátu HH:MM (0–23 h, 0–59 min).");
                  updateTime(i, "");
                }
              }}
            />
            <Pressable onPress={() => deleteRecord(i)}>
              <Text style={styles.icon}>🚮</Text>
            </Pressable>
          </GroupSection>
        ))}

        <View style={{ marginTop: 30 }}>
          <MyButton 
            title="Uložit" 
            onPress={saveChanges}
          />
        </View>
      </ScrollView>
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
    marginHorizontal: 30,
    textAlign: "center",
  },
  icon: {
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
