import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import GroupSection from "@/components/GroupSection";
import { normalizeTime } from "@/components/HelperFunctions";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import { Child, SleepRecord } from "@/components/storage/interfaces";
import Subtitle from "@/components/Subtitle";
import TimeSelector from "@/components/TimeSelector";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import uuid from 'react-native-uuid';

type DisplaySleepRecord = SleepRecord & { label: string };

const renumberSleeps = (records: SleepRecord[]): DisplaySleepRecord[] => {
  let sleepCount = 0;
  return records.map((r) => {
    if (r.state === "sleep") {
      sleepCount++;
      return { ...r, label: `${sleepCount}. spánek od` };
    }
    return { ...r, label: "Vzhůru od" };
  });
};

const getCleanTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function SleepAdd() {
  const router = useRouter();
  const { selectedChildId, selectedChild, updateChild } = useChild();
  
  const [newDate, setNewDate] = useState(formatDateLocal(new Date()));  
  const [records, setRecords] = useState<DisplaySleepRecord[]>([]);
  const [newTime, setNewTime] = useState(getCleanTime());
  const [newState, setNewState] = useState<"sleep" | "awake">("awake");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const checkDuplicateDate = (date: string) => {
    if (!selectedChild?.sleepRecords) return false;
    const exists = selectedChild.sleepRecords.some((r: any) => r.date === date);
    if (exists) {
      setErrorMessage("Pro tento den už existují záznamy. Použij režim úprav.");
      return true;
    }
    setErrorMessage("");
    return false;
  };

  // Při načtení stránky zkontrolujeme dnešní datum
  useEffect(() => {
    // Pokud právě ukládáme, kontrolu duplicity ignorujeme
    if (!isSaving) {
      checkDuplicateDate(newDate);
    }
  }, [newDate, selectedChild, isSaving]);
  
  // Při změně data
  const handleDateChange = (d: Date) => {
    const formatted = formatDateLocal(d);
    setNewDate(formatted);
    if (!checkDuplicateDate(formatted)) {
      setRecords([]);
    }
  };

  const updateTime = (index: number, t: string) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: t };
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
            const filtered = prev.filter((_, i) => i !== index);
            // Při přečíslování čisté SleepRecord (bez labelu)
            return renumberSleeps(filtered.map(({ label, ...rest }) => rest));
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
      Alert.alert("Chybný čas", "Zadejte čas ve formátu HH:MM.");
      return;
    }

    const newRec: SleepRecord = { 
      id: uuid.v4() as string, 
      date: newDate, 
      time: norm, 
      state: newState 
    };    
    
    const allRecords = [...records.map(({ label, ...rest }) => rest), newRec]
      .sort((a, b) => a.time.localeCompare(b.time));

    setRecords(renumberSleeps(allRecords));
    
    setNewState(newState === "sleep" ? "awake" : "sleep");
    setNewTime(getCleanTime());
  };

  const saveChanges = async () => {
    // 1. Validace
    if (!selectedChildId || !selectedChild || records.length === 0) return;
    if (errorMessage) {
      Alert.alert("Chyba", errorMessage);
      return;
    }

    setIsSaving(true);
    try {
      // 2. Příprava čistých dat (včetně ID pro offline identifikaci)
      const newDayRecords: SleepRecord[] = records.map(({ label, ...rest }) => ({
        id: rest.id || (uuid.v4() as string), 
        child_id: selectedChildId,
        date: rest.date,
        time: rest.time, // Zde jsou časy z tvého state 'records'
        state: rest.state
      }));

      // 3. Odstranění starých záznamů pro TENTO den z lokální kopie
      const otherDaysRecords = (selectedChild.sleepRecords || []).filter(
        (r) => r.date !== newDate
      );

      // 4. Vytvoření finálního objektu dítěte
      const updatedChild: Child = {
        ...selectedChild,
        sleepRecords: [...otherDaysRecords, ...newDayRecords]
      };

      await updateChild(updatedChild);

      router.back();
    } catch (e) {
      console.error("Chyba při ukládání spánku:", e);
      Alert.alert("Chyba", "Záznamy se nepodařilo uložit.");
    } finally {
      setIsSaving(false);
    }
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
              onChange={(d) => d && setNewDate(d)}
              birthISO={selectedChild ? selectedChild.birthDate : null}
            />
          </View>
          <DateSelector
            date={new Date(newDate)}
            onChange={handleDateChange}
            birthISO={selectedChild ? selectedChild.birthDate : null}
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
          <TimeSelector 
            time={newTime} 
            onChange={setNewTime}
          />
          <Pressable onPress={addRecord}>
            <Text style={styles.icon}>✅</Text>
          </Pressable>
        </GroupSection>

        {records.map((r, i) => (
          <GroupSection key={i} style={styles.row}>
            <Text style={{ flex: 1 }}>{r.label}</Text>
            <TimeSelector 
              time={r.time} 
              onChange={(t) => updateTime(i, t)}
            />
            <Pressable onPress={() => deleteRecord(i)}>
              <Text style={styles.icon}>🚮</Text>
            </Pressable>
          </GroupSection>
        ))}

        {records.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <MyButton 
              title={isSaving ? "Ukládám..." : "Uložit"} 
              onPress={saveChanges}
              disabled={isSaving}
            />
          </View>
        )}
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
    backgroundColor: COLORS.switchNonActive,
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
    backgroundColor: COLORS.primary,
  },
  switchText: {
    fontSize: 14,
  },
  switchTextActive: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
