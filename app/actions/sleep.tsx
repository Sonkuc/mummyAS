import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ChartColumn, Eye, EyeClosed } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type RecordType = {
  label: string;
  time: string; // HH:MM
  date: string; // YYYY-MM-DD
  state: "awake" | "sleep";
  extra?: string;
};

export default function Sleep() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [minutesSinceAwake, setMinutesSinceAwake] = useState<number | null>(null);
  const [minutesSinceSleep, setMinutesSinceSleep] = useState<number | null>(null);
  const [mode, setMode] = useState<"awake" | "sleep" | "">("");
  const [modeStart, setModeStart] = useState<number | null>(null);

  const router = useRouter();
  const { selectedChild, allChildren, selectedChildIndex, saveAllChildren } = useChild();

  // převod ISO → český formát
  const formatDateToCzech = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-");
      return `${day}.${month}.${year}`;
    }
    return dateStr;
  };

  const clearState = () => {
    setMode("");
    setMinutesSinceAwake(null);
    setMinutesSinceSleep(null);
    setModeStart(null);

    if (selectedChildIndex !== null) {
      const updated = [...allChildren];
      updated[selectedChildIndex].currentMode = null;
      saveAllChildren(updated);
    }
  };

  const addRecord = async (label: string, newMode: "awake" | "sleep") => {
    if (!selectedChild) return;

    if (newMode === "sleep") setMinutesSinceAwake(null);
    if (newMode === "awake") setMinutesSinceSleep(null);

    const now = new Date();
    const time = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    const date = now.toISOString().slice(0, 10); // vždy ISO YYYY-MM-DD

    const newRecord: RecordType = { date, time, state: newMode, label };

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
      updated[selectedChildIndex].currentMode = {
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

      if (selectedChild?.currentMode) {
        const { mode, start } = selectedChild.currentMode;
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

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} h ${m} min`;
    return `${m} min`;
  };

  const toTimestamp = (dateStr: string, timeStr: string) => {
    let year = 0, month = 0, day = 0;
    if (dateStr.includes("-")) {
      [year, month, day] = dateStr.split("-").map((s) => parseInt(s, 10));
    } else if (dateStr.includes(".")) {
      [day, month, year] = dateStr.split(".").map((s) => parseInt(s, 10));
    }
    const [hh, mm] = timeStr.split(":").map((s) => parseInt(s, 10));
    return new Date(year, month - 1, day, hh, mm).getTime();
  };

  // seskupení a výpočty per den
  const grouped = Object.entries(
    records.reduce((acc, rec) => {
      if (!acc[rec.date]) acc[rec.date] = [];
      acc[rec.date].push({ ...rec, ts: toTimestamp(rec.date, rec.time) });
      return acc;
    }, {} as Record<string, (RecordType & { ts: number })[]>)
  )
    .map(([date, recs]) => {
      const sortedAsc = [...recs].sort((a, b) => a.ts - b.ts);

      let totalSleepMinutes = 0;
      const enhanced: (RecordType & { ts: number })[] = [];
      let sleepCounter = 1;

      for (let i = 0; i < sortedAsc.length; i++) {
        const curr = sortedAsc[i];
        const next = sortedAsc[i + 1];
        let extra = "";

        if (next) {
          const minutes = Math.floor((next.ts - curr.ts) / 60000);
          if (minutes > 0) {
            extra = ` → ${formatDuration(minutes)}`;
            if (curr.state === "sleep") {
              totalSleepMinutes += minutes;
            }
          }
        }

        let label = curr.state === "sleep"
          ? `${sleepCounter++}. spánek od: ${curr.time}`
          : `Vzhůru od: ${curr.time}`;

        enhanced.push({ ...curr, label, extra });
      }

      const sortedDesc = [...enhanced].sort((a, b) => b.ts - a.ts);
      return {
        date,
        totalSleepMinutes,
        records: sortedDesc,
      };
    })
    .sort((a, b) => {
      const ta = toTimestamp(a.date, "23:59");
      const tb = toTimestamp(b.date, "23:59");
      return tb - ta;
    });

  const getLastMode = () => {
    if (selectedChild?.currentMode?.mode) {
      return selectedChild.currentMode.mode;
    }
    const last = selectedChild?.sleepRecords?.[selectedChild.sleepRecords.length - 1];
    return last?.state ?? null;
  };

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
              { backgroundColor: "#fff" },
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
            <Eye color="black" size={28} />
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
          {grouped.map(({ date, totalSleepMinutes, records }, groupIdx) => (
            <GroupSection key={`group-${date}-${groupIdx}`}>
              <View style={styles.row}>
                {isEditMode && (
                  <EditPencil
                    targetPath={`/actions/sleep-edit?date=${encodeURIComponent(date)}`}
                    color="#993769"
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
              <Text style={styles.totalText}>
                Celkem spánku: {Math.floor(totalSleepMinutes / 60)} h {totalSleepMinutes % 60} m
              </Text>
            </GroupSection>
          ))}
        </View>
      </ScrollView>

      <Pressable
        style={styles.statisticButton}
        onPress={() => router.push({ pathname: "/actions" })}
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
    borderColor: "#993769",
  },
  counterText: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 10,
  },
  deleteModeButton: {
    backgroundColor: "#993769",
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
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
    backgroundColor: "#993769",
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
