import CustomHeader from "@/components/CustomHeader";
import GroupSection from "@/components/GroupSection";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import { handleTimeInput, normalizeTime } from "@/components/SleepBfFunctions";
import * as api from "@/components/storage/api";
import { SleepRecord } from "@/components/storage/interfaces";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

export default function SleepEdit() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { selectedChildId, selectedChild, reloadChildren } = useChild();

  const [records, setRecords] = useState<DisplaySleepRecord[]>([]);  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newState, setNewState] = useState<"awake" | "sleep">("awake");

  // Načtení záznamů pro dané datum
  useEffect(() => {
    if (!selectedChild?.sleepRecords || !date) return;

    const dayRecords: SleepRecord[] = selectedChild.sleepRecords
      .filter((r) => r.date === date)
      .map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        state: r.state as "awake" | "sleep"
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    setRecords(renumberSleeps(dayRecords));
    setNewTime(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));

    if (dayRecords.length > 0) {
      const lastState = dayRecords[dayRecords.length - 1].state;
      setNewState(lastState === "sleep" ? "awake" : "sleep");
    } else {
      setNewState("sleep");
    }
  }, [selectedChild, date]);

  // Úprava času
  const updateTime = (index: number, newTimeValue: string) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: newTimeValue };
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
          setRecords((prev) => renumberSleeps(
            prev.filter((_, i) => i !== index).map(({ label, ...rest }) => rest)
          ));
        },
      },
    ]);
  };

  const addRecord = () => {
    const norm = normalizeTime(newTime);
    if (!norm) {
      Alert.alert("Chybný čas", "Zadejte čas ve formátu HH:MM.");
      return;
    }

    const newRec: SleepRecord = {
      id: uuid.v4() as string,
      date: date!,
      time: norm,
      state: newState,
    };

    setRecords((prev) => {
      const withoutLabels = prev.map(({ label, ...rest }) => rest);
      const updated = [...withoutLabels, newRec].sort((a, b) => a.time.localeCompare(b.time));
      
      const lastState = updated[updated.length - 1].state;
      setNewState(lastState === "sleep" ? "awake" : "sleep");
      setNewTime(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));

      return renumberSleeps(updated);
    });
  };

  // Uložení změn (Bulk update jako u kojení)
  const saveChanges = async () => {
    if (!selectedChildId || !date) return;

    const normalized: Omit<SleepRecord, "id">[] = [];
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const norm = normalizeTime(r.time);
      if (!norm) {
        Alert.alert("Chybný čas", `Záznam č. ${i + 1} obsahuje neplatný čas.`);
        return;
      }
      normalized.push({ date: r.date, time: norm, state: r.state });
    }

    try {
      // Předpokládám endpoint updateSleepDay v api.ts
      await api.updateSleepDay(selectedChildId, date, normalized);
      await reloadChildren();
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Chyba", "Nepodařilo se uložit změny.");
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep" onPress={saveChanges}/>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Upravit záznam</Title>
        <Subtitle style={{ textAlign: "center" }}>{formatDateToCzech(String(date))}</Subtitle>

        {records.map((rec, idx) => (
          <GroupSection key={rec.id} style={styles.row}>
            <Text style={{ flex: 1 }}>{rec.label}</Text>
            <TextInput
              style={styles.input}
              value={rec.time}
              // filtruje se vstup už během psaní
              onChangeText={(txt) => handleTimeInput(txt, (t) => updateTime(idx, t))}
              onBlur={() => {
                const current = records[idx]?.time ?? "";
                const norm = normalizeTime(current);
                if (norm) {
                  updateTime(idx, norm);
                } else {
                  Alert.alert("Chybný čas", "Zadej čas ve formátu HH:MM (0–23 h, 0–59 min).");
                  updateTime(idx, ""); // smaže neplatný, uživatel musí opravit
                }
              }}
            />
            <Pressable onPress={() => deleteRecord(idx)}>
              <Text style={styles.icon}>🚮</Text>
            </Pressable>
          </GroupSection>
        ))}

        <GroupSection style={styles.row}>
          <View style={[styles.switchRow, { flex: 1 }]}>
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
