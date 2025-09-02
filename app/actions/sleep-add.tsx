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
  const [newState, setNewState] = useState<"sleep" | "awake">("sleep");
  const [errorMessage, setErrorMessage] = useState("");

  // vezme datum narození z objektu dítěte 
  const getBirthISO = (child: any): string | null => {
    const v = child.birthDate;
    return typeof v === "string" ? v : null;
  };

  const validateDate = (date: string) => {
    if (!selectedChild) return false;

    const todayISO = new Date().toISOString().slice(0, 10);
    if (date > todayISO) {
      setErrorMessage("Nelze přidat záznam s budoucím datem.");
      return true;
    }

    const exists = (selectedChild.sleepRecords || []).some(r => r.date === date);
    if (exists) {
      setErrorMessage("Pro tento den už existují záznamy. Otevři je v režimu úprav.");
      setRecords([]);
      return true;
    }

    setErrorMessage("");
    return false;
  };

  const isFutureDateTime = (date: string, time: string) => {
    const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
    const [y, m, d] = date.split("-").map((x) => parseInt(x, 10));
    const dt = new Date(y, m - 1, d, hh, mm);
    return dt.getTime() > Date.now();
  };

  const isValidDate = (dateStr: string, birthISO: string | null): boolean => {
    // Regex – přesně 4 čísla, pomlčka, 2 čísla, pomlčka, 2 čísla
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

    const [y, m, d] = dateStr.split("-").map(Number);

    // základní rozsahy
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;

    // vytvoříme datum – JS opravuje nevalidní (např. 2025-02-30 -> 2025-03-02),
    // proto to musíme porovnat zpětně
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
      return false;
    }

    // dnes + narození
    const todayISO = new Date().toISOString().slice(0, 10);
    if (dateStr > todayISO) return false;
    if (birthISO && dateStr < birthISO) return false;

    return true;
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

  // jen čísla a pomlčky, max 10 znaků (YYYY-MM-DD)
  const handleDateInput = (txt: string, set: (v: string) => void) => {
  // odstraníme všechno kromě číslic
  let t = txt.replace(/[^\d]/g, "");

  // max délka 8 číslic (YYYYMMDD)
  if (t.length > 8) t = t.slice(0, 8);

  // vložíme pomlčky na pevné pozice
  if (t.length > 4) {
    t = t.slice(0, 4) + "-" + t.slice(4);
  }
  if (t.length > 7) {
    t = t.slice(0, 7) + "-" + t.slice(7);
  }

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
    validateDate(today);
  }, [selectedChild]);

  // Při změně data
  const handleDateChange = (d: Date) => {
    const formatted = d.toISOString().slice(0, 10);
    setNewDate(formatted);
    const isInvalid = validateDate(formatted);

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

    if (isFutureDateTime(newDate, norm)) {
      Alert.alert("Chyba", "Nelze přidat záznam s budoucím datem.");
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

    const birthISO = selectedChild ? getBirthISO(selectedChild) : null;
    if (!isValidDate(newDate, birthISO)) {
      Alert.alert(
        "Chybné datum",
        "Zadej platné datum ve formátu YYYY-MM-DD."
      );
      return;
    }

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
      if (isFutureDateTime(rec.date, norm)) {
        Alert.alert("Chyba", "Záznamy obsahují budoucí čas.");
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
            <MyTextInput
              placeholder="YYYY-MM-DD"
              value={newDate}
              onChangeText={(txt) => handleDateInput(txt, setNewDate)}
              onBlur={() => {
                const birthISO = selectedChild ? getBirthISO(selectedChild) : null;
                if (!isValidDate(newDate, birthISO)) {
                  Alert.alert(
                    "Chybný datum",
                    "Zadej platné datum ve formátu YYYY-MM-DD, které není budoucí ani před narozením dítěte."
                  );
                  setNewDate(today);
                }
              }}
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
