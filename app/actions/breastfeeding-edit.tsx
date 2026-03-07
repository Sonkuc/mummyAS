import CustomHeader from "@/components/CustomHeader";
import GroupSection from "@/components/GroupSection";
import { normalizeTime } from "@/components/HelperFunctions";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import type { BreastfeedingRecord, Child } from "@/components/storage/interfaces";
import Subtitle from "@/components/Subtitle";
import TimeSelector from "@/components/TimeSelector";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import uuid from "react-native-uuid";

type DisplayBreastfeedingRecord = BreastfeedingRecord & { label: string };

// číslování spánků
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

export default function BreastfeedingEdit() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { selectedChildId, selectedChild, updateChild } = useChild();

  const [records, setRecords] = useState<DisplayBreastfeedingRecord[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newState, setNewState] = useState<"stop" | "start">("stop");

  // Načtení záznamů pro dané datum
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!selectedChild?.breastfeedingRecords || !date) return;

    // Inicializujeme pouze jednou při načtení
    if (!isInitialized.current) {
      const dayRecords: BreastfeedingRecord[] = selectedChild.breastfeedingRecords
        .filter((r) => r.date === date)
        .map((r) => ({
          id: r.id,
          date: r.date,
          time: r.time,
          state: r.state as "start" | "stop"
        }))
        .sort((a, b) => a.time.localeCompare(b.time));

      setRecords(renumberFeed(dayRecords));

      if (dayRecords.length > 0) {
        const lastState = dayRecords[dayRecords.length - 1].state;
        setNewState(lastState === "start" ? "stop" : "start");
      } else {
        setNewState("start");
      }
      
      setNewTime(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));
      isInitialized.current = true;
    }
  }, [selectedChild?.id, date]); // Sledujeme ID a datum
  
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
          setRecords((prev) => renumberFeed(
            prev.filter((_, i) => i !== index)
          ));
        },
      },
    ]);
  };

  const addRecord = () => {
    // normalizace newTime před přidáním
    const norm = normalizeTime(newTime);
    if (!norm) {
      Alert.alert("Chybný čas", "Zadej čas ve formátu HH:MM (0–23 h, 0–59 min).");
      return;
    }

    const newRec: BreastfeedingRecord = {
      id: uuid.v4(),
      date: date!,
      time: norm,
      state: newState,
    };

    setRecords((prev) => {
      const withoutLabels: BreastfeedingRecord[] = prev.map(({ label, ...rest }) => rest);
      const updated = [...withoutLabels, newRec].sort((a, b) => a.time.localeCompare(b.time));
      const renumbered = renumberFeed(updated);

      // Najdeme poslední stav a přepneme opačný
      const lastState = updated[updated.length - 1].state;
      setNewState(lastState === "start" ? "stop" : "start");

      // Předvyplníme aktuální čas
      const now = new Date();
      const currentTime = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
      setNewTime(currentTime);

      return renumbered;
    });
  };

  // Uložení změn
  const saveChanges = async () => {
    if (!selectedChildId || !selectedChild || !date) return;

    const normalizedDayRecords: BreastfeedingRecord[] = records.map(r => ({
      id: r.id || uuid.v4(),
      date: r.date,
      time: normalizeTime(r.time) || "00:00",
      state: r.state
    }));

    const otherDaysRecords = selectedChild.breastfeedingRecords?.filter(
      (r) => r.date !== date
    ) || [];

    const updatedChild: Child = {
      ...selectedChild,
      // Pokud je normalizedDayRecords prázdné, do pole se pro tento den nic nepřidá. To je správně.
      breastfeedingRecords: [...otherDaysRecords, ...normalizedDayRecords],
    };

    try {
      // TADY JE ZMĚNA: Potřebujeme předat informaci o tom, na který den se sahlo
      // Pokud tvůj updateChild přijímá jen child, musíme upravit Provider.
      await updateChild(updatedChild); 
      router.back();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/breastfeeding" onPress={saveChanges} />
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
