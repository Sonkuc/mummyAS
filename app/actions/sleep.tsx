import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import { clearStateGeneric, formatDuration, getLastModeGeneric, toTimestamp } from "@/components/SleepBfFunctions";
import type { GroupedSleepRecord, RecordTypeSleep } from "@/components/storage/SaveChildren";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ChartColumn, Eye, EyeClosed } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Sleep() {
  const [records, setRecords] = useState<RecordTypeSleep[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [minutesSinceAwake, setMinutesSinceAwake] = useState<number | null>(null);
  const [minutesSinceSleep, setMinutesSinceSleep] = useState<number | null>(null);
  const [mode, setMode] = useState<"awake" | "sleep" | "">("");
  const [modeStart, setModeStart] = useState<number | null>(null);

  const router = useRouter();
  const { selectedChild, allChildren, selectedChildIndex, saveAllChildren } = useChild();

  const clearState = () =>
    clearStateGeneric("sleep", setMode, setMinutesSinceAwake, setMinutesSinceSleep, setModeStart, selectedChildIndex, allChildren, saveAllChildren);

  const getLastMode = () =>
    getLastModeGeneric("sleep", selectedChild);

  const addRecord = async (label: string, newMode: "awake" | "sleep") => {
    if (!selectedChild) return;

    if (newMode === "sleep") setMinutesSinceAwake(null);
    if (newMode === "awake") setMinutesSinceSleep(null);

    const now = new Date();
    const time = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    const date = now.toISOString().slice(0, 10);
    const newRecord: RecordTypeSleep = { date, time, state: newMode, label };

    setRecords((prev) => [...prev, newRecord]);

    const startTimestamp = toTimestamp(date, time);
    setMode(newMode);
    setModeStart(startTimestamp);

    if (selectedChildIndex !== null) {
      const updated = [...allChildren];
      updated[selectedChildIndex].sleepRecords = [
        ...(updated[selectedChildIndex].sleepRecords || []),
        { date, time, state: newMode },
      ];
      updated[selectedChildIndex].currentModeSleep = {
        mode: newMode,
        start: startTimestamp,
      };
      saveAllChildren(updated);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (selectedChild?.sleepRecords) {
        setRecords(
          (selectedChild.sleepRecords ?? []).map((rec) => ({
            label: rec.state === "sleep" ? "Spánek od:" : "Vzhůru od:",
            time: rec.time ?? "00:00",
            date: rec.date ?? "",
            state: rec.state ?? "awake",
          }))
        );
      }
      if (selectedChild?.currentModeSleep) {
        const { mode, start } = selectedChild.currentModeSleep;
        setMode(mode);
        setModeStart(start);

        const diff = Math.floor((Date.now() - start) / 60000);
        if (mode === "sleep") setMinutesSinceSleep(diff);
        if (mode === "awake") setMinutesSinceAwake(diff);
      }
    }, [selectedChild])
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (mode && modeStart) {
      const tick = () => {
        const diffMinutes = Math.floor((Date.now() - modeStart) / 60000);
        if (mode === "sleep") setMinutesSinceSleep(diffMinutes);
        if (mode === "awake") setMinutesSinceAwake(diffMinutes);
      };
      tick();
      interval = setInterval(tick, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, modeStart]);

  // memoizovaný výpočet grouped podle records
  const grouped: GroupedSleepRecord[] = useMemo(() => {
    const groupedMap = records.reduce((acc, rec) => {
      if (!acc[rec.date]) acc[rec.date] = [];
      acc[rec.date].push({ ...rec, ts: toTimestamp(rec.date, rec.time) });
      return acc;
    }, {} as Record<string, (RecordTypeSleep & { ts: number })[]>);

    const groups = Object.entries(groupedMap)
      .map(([date, recs]) => {
        const sortedAsc = recs.slice().sort((a, b) => a.ts - b.ts);

        let totalSleepMinutes = 0;
        let sleepCounter = 1;

        const enhanced = sortedAsc.map((curr, i) => {
          const next = sortedAsc[i + 1];
          let extra = "";

          if (next) {
            const minutes = Math.floor((next.ts - curr.ts) / 60000);
            if (minutes > 0) {
              extra = ` → ${formatDuration(minutes)}`;
              if (curr.state === "sleep") totalSleepMinutes += minutes;
            }
          }

          const label =
            curr.state === "sleep"
              ? `${sleepCounter++}. spánek od: ${curr.time}`
              : `Vzhůru od: ${curr.time}`;

          return { ...curr, label, extra };
        });

        return {
          date,
          totalSleepMinutes,
          records: enhanced.slice().sort((a, b) => b.ts - a.ts),
        };
      })
      .sort((a, b) => toTimestamp(b.date, "23:59") - toTimestamp(a.date, "23:59"));

    // dopočítání nočního spánku (mutuje výsledné groups)
    for (let i = 0; i < groups.length - 1; i++) {
      const today = groups[i];
      const yesterday = groups[i + 1];

      const lastSleep = yesterday.records
        .slice()
        .sort((a, b) => a.ts - b.ts)
        .filter(r => r.state === "sleep")
        .at(-1);

      const firstAwake = today.records
        .slice()
        .sort((a, b) => a.ts - b.ts)
        .find(r => r.state === "awake");

      if (lastSleep && firstAwake) {
        const nightMinutes = Math.floor((firstAwake.ts - lastSleep.ts) / 60000);
        if (nightMinutes > 0) {
          yesterday.totalSleepMinutes += nightMinutes;
          (yesterday as any).nightSleepMinutes = nightMinutes;

          const recIndex = yesterday.records.findIndex(r => r.ts === lastSleep.ts);
          if (recIndex !== -1) {
            yesterday.records[recIndex].extra = ` → ${formatDuration(nightMinutes)}`;
          }
        }
      }
    }

    return groups;
  }, [records]); // přepočítá se pouze při změně records

  // uložíme grouped do storage pokud se změní
  useEffect(() => {
    if (selectedChildIndex !== null) {
      const updated = [...allChildren];
      updated[selectedChildIndex].groupedSleep = grouped;
      saveAllChildren(updated);
    }
  }, [grouped, selectedChildIndex, saveAllChildren]);

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/sleep-add" />
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Spánek</Title>
        <View style={styles.buttonsRow}>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: "white" },
              mode === "awake" && styles.eyeButtonSelected,
            ]}
            onPress={() => {
              if (getLastMode() === "awake") {
                Alert.alert(`${selectedChild?.name} je už vzhůru.`);
                return;
              }
              addRecord("Vzhůru od:", "awake");
            }}
          >
            <Eye size={28} />
          </Pressable>

          <Pressable
            style={[
              styles.button,
              { backgroundColor: "#000" },
              mode === "sleep" && styles.eyeButtonSelected,
            ]}
            onPress={() => {
              if (getLastMode() === "sleep") {
                Alert.alert(`${selectedChild?.name} už spí.`);
                return;
              }
              addRecord("Spánek od:", "sleep");
            }}
          >
            <EyeClosed color="white" size={28} />
          </Pressable>
        </View>

        {mode && (
          <View>
            <Text style={styles.counterText}>
              {mode === "sleep" && minutesSinceSleep !== null &&
                `Spí ${formatDuration(minutesSinceSleep)}`}
              {mode === "awake" && minutesSinceAwake !== null &&
                `Vzhůru ${formatDuration(minutesSinceAwake)}`}
            </Text>
            <Pressable style={styles.deleteModeButton} onPress={clearState}>
              <Text style={styles.buttonText}>Reset</Text>
            </Pressable>
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          {grouped.map(({ date, totalSleepMinutes, records, nightSleepMinutes }, groupIdx) => (
            <GroupSection key={`group-${date}-${groupIdx}`}>
              <View style={styles.row}>
                {isEditMode && (
                  <EditPencil
                    targetPath={`/actions/sleep-edit?date=${encodeURIComponent(date)}`}
                    color={COLORS.primary}
                  />
                )}
                <Text style={styles.dateTitle}>{formatDateToCzech(date)}</Text>
              </View>
              {records.map((rec, recIdx) => (
                <Text
                  key={`rec-${date}-${rec.time}-${recIdx}`}
                  style={styles.recordText}
                >
                  {rec.label}{rec.extra ?? ""}
                </Text>
              ))}
              {nightSleepMinutes !== undefined && (
                <Text style={styles.totalText}>
                  Denní spánek: {Math.floor((totalSleepMinutes-nightSleepMinutes) / 60)} h {(totalSleepMinutes-nightSleepMinutes) % 60} m
                </Text>
              )}
              <Text style={styles.totalText}>
                Celkem spánku: {Math.floor(totalSleepMinutes / 60)} h {totalSleepMinutes % 60} m
              </Text>
            </GroupSection>
          ))}
        </View>
      </ScrollView>

      <Pressable
        style={styles.statisticButton}
        onPress={() => router.push({pathname: "/actions/sleep-statistic"})}
      >
        <ChartColumn color="white" size={28} />
      </Pressable>
      <EditPencil
        onPress={() => setIsEditMode(!isEditMode)}
        color="white"
        circle
        editMode={isEditMode}
      />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-evenly"
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
