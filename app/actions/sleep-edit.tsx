import CustomHeader from "@/components/CustomHeader";
import GroupSection from "@/components/GroupSection";
import { normalizeTime } from "@/components/HelperFunctions";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import { DisplaySleepRecord, SleepRecord, SleepSyncDay } from "@/components/storage/interfaces";
import Subtitle from "@/components/Subtitle";
import TimeSelector from "@/components/TimeSelector";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import uuid from 'react-native-uuid';

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
  const { selectedChildId, selectedChild, updateSleepDayRecord } = useChild();

  const [records, setRecords] = useState<DisplaySleepRecord[]>([]);  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newState, setNewState] = useState<"awake" | "sleep">("awake");

  // Proběhla první inicializace?
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!selectedChild?.sleepRecords || !date) return;
    if (!isInitialized.current) {
      const dayRecords: SleepRecord[] = selectedChild.sleepRecords
        .filter((r) => r.date === date)
        .map((r) => ({
          id: r.id,
          child_id: r.child_id,
          date: r.date,
          time: r.time,
          state: r.state as "awake" | "sleep"
        }))
        .sort((a, b) => a.time.localeCompare(b.time));

      setRecords(renumberSleeps(dayRecords));
      
      // Nastavení newState pro další záznam
      if (dayRecords.length > 0) {
        const lastState = dayRecords[dayRecords.length - 1].state;
        setNewState(lastState === "sleep" ? "awake" : "sleep");
      } else {
        setNewState("sleep");
      }

      isInitialized.current = true;
    }
  }, [selectedChild?.id, date]);

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
      child_id: selectedChildId || "",
      date: date!,
      time: norm,
      state: newState,
    };

    setRecords((prev) => {
      const withoutLabels = prev.map(({ label, ...rest }) => rest);
      const updated = [...withoutLabels, newRec].sort((a, b) => a.time.localeCompare(b.time));
      
      const lastState = updated[updated.length - 1].state;
      setNewState(lastState === "sleep" ? "awake" : "sleep");
      const now = new Date();
      setNewTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

      return renumberSleeps(updated);
    });
  };

  // Uložení změn (Bulk update)
  const saveChanges = async () => {
    if (!selectedChildId || !date) return;

    // Příprava čistých dat (odstraníme label, aby odpovídal SleepSyncDay)
    const sleepSyncDay: SleepSyncDay = records.map((r) => ({
      id: r.id,
      date: date,
      time: normalizeTime(r.time) || r.time,
      state: r.state,
    }));

    try {
      // Použití nové metody z kontextu (zajistí lokální update i offline frontu)
      await updateSleepDayRecord(selectedChildId, date, sleepSyncDay);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/actions/breastfeeding");
      }
    } catch (error) {
      console.error("Kritická chyba při ukládání kojení:", error);
      Alert.alert("Chyba", "Nepodařilo se uložit data.");
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
            <TimeSelector 
              time={rec.time} 
              onChange={(t) => updateTime(idx, t)}
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
          <TimeSelector 
            time={newTime} 
            onChange={setNewTime}
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
