import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import { formatDuration, toTimestamp } from "@/components/SleepBfFunctions";
import * as api from "@/components/storage/api";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ChartColumn, Eye, EyeClosed } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Sleep() {
  const [records, setRecords] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [mode, setMode] = useState<"awake" | "sleep" | "">("");
  const [modeStart, setModeStart] = useState<number | null>(null);
  const [minutesSinceMode, setMinutesSinceMode] = useState<number | null>(null);

  const router = useRouter();
  const { selectedChildId, selectedChild, reloadChildren } = useChild();

  // 1. NAČTENÍ DAT A SYNCHRONIZACE REŽIMU (stejně jako u kojení)
  useFocusEffect(
    useCallback(() => {
      if (selectedChild?.sleepRecords) {
        setRecords(
          selectedChild.sleepRecords.map((rec: any) => ({
            ...rec,
            label: rec.state === "sleep" ? "Spánek od:" : "Vzhůru od:",
          }))
        );
      }

      // Synchronizace "Live" stavu z backendu (přidáme currentModeSleep do modelu Child)
      if (selectedChild?.currentModeSleep) {
        const { mode, start } = selectedChild.currentModeSleep;
        setMode(mode);
        setModeStart(start);
        const diff = Math.floor((Date.now() - start) / 60000);
        setMinutesSinceMode(diff);
      } else {
        // Fallback na poslední záznam, pokud currentModeSleep není nastaven
        const sorted = [...(selectedChild?.sleepRecords || [])].sort(
          (a, b) => toTimestamp(a.date, a.time) - toTimestamp(b.date, b.time)
        );
        const last = sorted.at(-1);
        if (last) {
          setMode(last.state);
          const ts = toTimestamp(last.date, last.time);
          setModeStart(ts);
          setMinutesSinceMode(Math.floor((Date.now() - ts) / 60000));
        }
      }
    }, [selectedChild])
  );

  // 2. TICKER
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (mode && modeStart) {
      const tick = () => {
        setMinutesSinceMode(Math.floor((Date.now() - modeStart) / 60000));
      };
      tick();
      interval = setInterval(tick, 60000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [mode, modeStart]);

  // 3. AKCE: PŘIDÁNÍ ZÁZNAMU (Opravené API a Bulk)
  const addRecord = async (newMode: "awake" | "sleep") => {
    if (!selectedChildId) return;
    
    const now = new Date();
    const timestamp = Date.now();
    const payload = {
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
      state: newMode
    };

    try {
      // Použijeme createSleepBulk (v api.ts) a pošleme pole
      await api.createSleepBulk(selectedChildId, [payload]);

      // Uložíme live stav do profilu dítěte (stejně jako u kojení)
      await api.updateChild(selectedChildId, { 
        currentModeSleep: { mode: newMode, start: timestamp } 
      });

      await reloadChildren(); 
    } catch (e) {
      Alert.alert("Chyba", "Nepodařilo se uložit záznam.");
    }
  };

  // 4. AKCE: RESET (Smazání live stavu)
  const clearState = async () => {
    if (!selectedChildId) return;
    try {
      await api.updateChild(selectedChildId, { currentModeSleep: null });
      setMode("");
      setModeStart(null);
      setMinutesSinceMode(null);
      await reloadChildren();
    } catch (e) {
      Alert.alert("Chyba", "Nepodařilo se resetovat stav.");
    }
  };

  // 3. VÝPOČET GROUPED DAT (PRO ZOBRAZENÍ)
  const grouped = useMemo(() => {
    if (!records.length) return [];

    // 1. Seskupení podle data
    // Definujeme typ pro acc (akumulátor): objekt, kde klíč je string a hodnota je pole objektů
    const groupedMap = records.reduce((acc: Record<string, any[]>, rec: any) => {
      if (!acc[rec.date]) acc[rec.date] = [];
      acc[rec.date].push({ ...rec, ts: toTimestamp(rec.date, rec.time) });
      return acc;
    }, {});

    // 2. Transformace na pole a výpočet durací
    const groups = Object.entries(groupedMap)
      .map(([date, recs]: [string, any[]]) => { // Přidán typ pro parametry map
        const sortedAsc = [...recs].sort((a: any, b: any) => a.ts - b.ts); // Přidán typ a, b
        let totalSleepMinutes = 0;
        let sleepCounter = 1;

        const enhanced = sortedAsc.map((curr: any, i: number) => { // Přidán typ curr, i
          const next = sortedAsc[i + 1];
          let extra = "";
          if (next) {
            const minutes = Math.floor((next.ts - curr.ts) / 60000);
            if (minutes > 0) {
              extra = ` → ${formatDuration(minutes)}`;
              if (curr.state === "sleep") totalSleepMinutes += minutes;
            }
          }
          const label = curr.state === "sleep" 
            ? `${sleepCounter++}. spánek od: ${curr.time}` 
            : `Vzhůru od: ${curr.time}`;
          return { ...curr, label, extra };
        });

        return {
          date,
          totalSleepMinutes,
          records: enhanced.reverse(),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    // 3. LOGIKA NOČNÍHO SPÁNKU (Přehození minut mezi dny)
    for (let i = 0; i < groups.length - 1; i++) {
      const today = groups[i];
      const yesterday = groups[i + 1];

      const lastSleepYesterday = yesterday.records.find(r => r.state === "sleep");
      const firstAwakeToday = today.records.slice().reverse().find(r => r.state === "awake");

      if (lastSleepYesterday && firstAwakeToday && firstAwakeToday.ts > lastSleepYesterday.ts) {
        const nightMinutes = Math.floor((firstAwakeToday.ts - lastSleepYesterday.ts) / 60000);
        if (nightMinutes > 0) {
          yesterday.totalSleepMinutes += nightMinutes;
          (yesterday as any).nightSleepMinutes = nightMinutes;
          // Aktualizace popisku u včerejšího posledního spánku
          const recIdx = yesterday.records.findIndex(r => r.id === lastSleepYesterday.id);
          if (recIdx !== -1) yesterday.records[recIdx].extra = ` → ${formatDuration(nightMinutes)}`;
        }
      }
    }

    return groups;
  }, [records]);

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/sleep-add" />
      </CustomHeader>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Spánek</Title>

        <View style={styles.buttonsRow}>
          <Pressable
            style={[styles.button, { backgroundColor: "white" }, mode === "awake" && styles.eyeButtonSelected]}
            onPress={() => addRecord("awake")}
          >
            <Eye size={28}/>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: "#000" }, mode === "sleep" && styles.eyeButtonSelected]}
            onPress={() => addRecord("sleep")}
          >
            <EyeClosed color="white" size={28}/>
          </Pressable>
        </View>

        {mode !== "" && (
          <View style={{ alignItems: 'center', marginVertical: 15 }}>
            <Text style={styles.counterText}>
              {mode === "sleep" 
                ? `Spí ${formatDuration(minutesSinceMode ?? 0)}` 
                : `Vzhůru ${formatDuration(minutesSinceMode ?? 0)}`}
            </Text>
            <Pressable style={styles.deleteModeButton} onPress={clearState}>
              <Text style={styles.buttonText}>Reset stavu</Text>
            </Pressable>
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          {grouped.map((group) => (
            <GroupSection key={group.date}>
              <View style={styles.row}>
                {isEditMode && (
                  <EditPencil 
                    targetPath={`/actions/sleep-edit?date=${encodeURIComponent(group.date)}`} 
                    color={COLORS.primary} 
                  />
                )}
                <Text style={styles.dateTitle}>{formatDateToCzech(group.date)}</Text>
              </View>

              {group.records.map((rec: any, idx: number) => (
                <Text key={idx} style={styles.recordText}>
                  {rec.label}{rec.extra}
                </Text>
              ))}

              <Text style={styles.totalText}>
                Celkem spánku: {Math.floor(group.totalSleepMinutes / 60)}h {group.totalSleepMinutes % 60}m
              </Text>
            </GroupSection>
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.statisticButton} onPress={() => router.push("/actions/sleep-statistic")}>
        <ChartColumn color="white" size={28} />
      </Pressable>

      <EditPencil onPress={() => setIsEditMode(!isEditMode)} color="white" circle editMode={isEditMode} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    gap: 30,
  },
  button: {
    padding: 15,
    borderRadius: 12,
  },
  eyeButtonSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  counterText: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 10,
  },
  deleteModeButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordText: {
    fontSize: 16,
    marginLeft: 10,
  },
  totalText: {
    fontWeight: "bold",
    marginTop: 5,
    fontSize: 16,
  },
  dateTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 16,
  },
  statisticButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 10,
    position: "absolute",
    bottom: 25,
    left: 30,
    zIndex: 100,
  },
});
