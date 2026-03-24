import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import GroupSection from "@/components/GroupSection";
import { normalizeTime } from "@/components/HelperFunctions";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import type { BreastfeedingRecord, Child } from "@/components/storage/interfaces";
import Subtitle from "@/components/Subtitle";
import TimeSelector from "@/components/TimeSelector";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import uuid from "react-native-uuid";

type DisplayBreastfeedingRecord = BreastfeedingRecord & { label: string };

const renumberFeed = (records: BreastfeedingRecord[]): DisplayBreastfeedingRecord[] => {
  let feedCount = 0;
  return records.map((r) => {
    if (r.state === "start") {
      feedCount++;
      return { ...r, label: `Začátek ${feedCount}. kojení` };
    }
    return { ...r, label: "Konec kojení" };
  });
};

export default function BreastfeedingAdd() {
  const router = useRouter();
  const { selectedChildId, selectedChild, updateChild } = useChild();

  const now = new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  const [newDate, setNewDate] = useState(formatDateLocal(new Date()));
  const [records, setRecords] = useState<DisplayBreastfeedingRecord[]>([]);
  const [newTime, setNewTime] = useState(now);
  const [newState, setNewState] = useState<"start" | "stop">("start");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false); // Indikátor ukládání

  const checkDuplicateDate = (date: string) => {
    if (!selectedChild) return false;

    const exists = (selectedChild.breastfeedingRecords|| []).some(r => r.date === date);
    if (exists) {
      setErrorMessage("Pro tento den už existují záznamy. Otevři je v režimu úprav.");
      setRecords([]);
      return true;
    }

    setErrorMessage("");
    return false;
  };
  
  // Při načtení stránky zkontrolovat dnešní datum
  useEffect(() => {
    // Pokud právě ukládáme, kontrolu duplicity ignorujeme
    if (!isSaving) {
      checkDuplicateDate(newDate);      }
  }, [newDate, selectedChild, isSaving]);

  // Při změně data
  const handleDateChange = (d: Date) => {
    const formatted = formatDateLocal(d);
    setNewDate(formatted);

    const isInvalid = checkDuplicateDate(formatted);
    if (isInvalid || !selectedChild) return;

    setRecords([]);
    setNewTime(
      new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })
    );
    setNewState("start");
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
          setRecords((prev) => renumberFeed(
            prev.filter((_, i) => i !== index)
          ));
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

    const newRec: BreastfeedingRecord = { id: uuid.v4(), date: newDate, time: norm, state: newState };

    const allRecords = [...records.map(r => ({
      id: r.id,
      date: r.date,
      time: r.time,
      state: r.state
    })), newRec].sort((a, b) => a.time.localeCompare(b.time));
    setRecords(renumberFeed(allRecords));

    const now = new Date();
    setNewTime(now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));
    const last = allRecords[allRecords.length - 1];
    setNewState(last.state === "start" ? "stop" : "start");
  };

  // --- LOGIKA UKLÁDÁNÍ NA BACKEND ---
  const saveChanges = async () => {
    if (!selectedChildId || !selectedChild || records.length === 0) {
      Alert.alert("Chyba", "Nebyl přidán žádný záznam.");
      return;
    }

    if (errorMessage) {
      Alert.alert("Chyba", errorMessage);
      return;
    }

    setIsSaving(true);
    try {
      // 1. Příprava čistých dat s unikátními ID 
      const newDayRecords: BreastfeedingRecord[] = records.map(r => ({
        id: r.id || (uuid.v4() as string),
        date: newDate,
        time: r.time,
        state: r.state
      }));

      // 2. Zachování záznamů z ostatních dnů
      const otherDaysRecords = (selectedChild.breastfeedingRecords || []).filter(
        (r) => r.date !== newDate
      );

      // 3. Sestavení nového objektu dítěte
      const updatedChild: Child = {
        ...selectedChild,
        breastfeedingRecords: [...otherDaysRecords, ...newDayRecords]
      };

      // 4. Uložení skrze kontext
      await updateChild(updatedChild);

      router.back();
    } catch (error) {
      console.error("Chyba při ukládání kojení:", error);
      Alert.alert("Chyba", "Nepodařilo se uložit záznamy.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/breastfeeding" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Přidat záznam</Title>
        <Subtitle>Datum</Subtitle>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
              style={[styles.switchBtn, newState === "start" && styles.switchBtnActive]}
              onPress={() => setNewState("start")}
            >
              <Text style={newState === "start" ? styles.switchTextActive : styles.switchText}>
                Začátek
              </Text>
            </Pressable>
            <Pressable
              style={[styles.switchBtn, newState === "stop" && styles.switchBtnActive]}
              onPress={() => setNewState("stop")}
            >
              <Text style={newState === "stop" ? styles.switchTextActive : styles.switchText}>
                Konec
              </Text>
            </Pressable>
          </View>
          <TimeSelector 
            time={newTime} 
            onChange={setNewTime}
          />
          <Pressable onPress={addRecord}>
            <Text style={[styles.icon, isSaving && { opacity: 0.5 }]}>✅</Text>
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