import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
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
  date: string; // DD.MM.
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

  /*const clearState = () => {
    setMode("");
    setMinutesSinceAwake(null);
    setMinutesSinceSleep(null);
    setModeStart(null);

    if (selectedChildIndex !== null) {
      const updated = [...allChildren];
      updated[selectedChildIndex].currentMode = null; // 🔑 smažeme uložený mód
      saveAllChildren(updated);
    }
  };*/

  const addRecord = async (label: string, newMode: "awake" | "sleep") => {
    if (!selectedChild) return;

    if (newMode === "sleep") setMinutesSinceAwake(null);
    if (newMode === "awake") setMinutesSinceSleep(null);

    const now = new Date();
    const time = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("cs-CZ");

    const newRecord: RecordType = { date, time, state: newMode, label };

    setRecords((prev) => [...prev, newRecord]);

    const [day, month, year] = date.split(".").map((s) => parseInt(s, 10));
    const [hour, minute] = time.split(":").map((s) => parseInt(s, 10));
    const startDate = new Date(year, month - 1, day, hour, minute);
    const startTimestamp = startDate.getTime();

    setMode(newMode);
    setModeStart(startTimestamp); // uložíme absolutní čas startu

    // uložíme do dítěte i currentMode, aby zůstal zachován po zavření aplikace
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

   // načtení records i currentMode po otevření stránky
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

   // průběžně přepočítáváme rozdíl v minutách
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (mode && modeStart) {
      const tick = () => {
        const diffMinutes = Math.floor((Date.now() - modeStart) / 60000);
        if (mode === "sleep") setMinutesSinceSleep(diffMinutes);
        if (mode === "awake") setMinutesSinceAwake(diffMinutes);
      };

      tick(); // spočítáme hned
      interval = setInterval(tick, 60000); // pak každou minutu
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, modeStart]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h} h ${m} min`;
    }
    return `${m} min`;
  };

  const toTimestamp = (dateStr: string, timeStr: string) => {
    const parts = dateStr.split(".").map((s) => s.trim()).filter(Boolean);
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();

    const [hh, mm] = timeStr.split(":").map((s) => parseInt(s, 10));
    return new Date(y, m - 1, d, hh, mm).getTime();
  };

  const withTs = records.map((r) => ({ ...r, ts: toTimestamp(r.date, r.time) }));

  const asc = [...withTs].sort((a, b) => a.ts - b.ts);

  const extrasMap = new Map<number, string>();
  const sleepSumByDate = new Map<string, number>();

  for (let i = 0; i < asc.length - 1; i++) {
    const curr = asc[i];
    const next = asc[i + 1];

    if (i === 0) continue;

    const minutes = Math.floor((next.ts - curr.ts) / 60000);
    if (minutes <= 0) continue;

    if (curr.state === "sleep") {
      extrasMap.set(curr.ts, ` → ${formatDuration(minutes)}`);
      sleepSumByDate.set(curr.date, (sleepSumByDate.get(curr.date) || 0) + minutes);
    } else {
      extrasMap.set(curr.ts, ` → ${formatDuration(minutes)}`);
    }
  }

  const grouped = Object.entries(
    withTs.reduce((acc, rec) => {
      if (!acc[rec.date]) acc[rec.date] = [];
      acc[rec.date].push(rec);
      return acc;
    }, {} as Record<string, (RecordType & { ts: number })[]>)
  )
    .map(([date, recs]) => {
      const sortedDesc = [...recs].sort((a, b) => b.ts - a.ts);
      const enhanced = sortedDesc.map((r) => ({ ...r, extra: extrasMap.get(r.ts) || "" }));
      return {
        date,
        totalSleepMinutes: sleepSumByDate.get(date) || 0,
        records: enhanced,
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
              addRecord("spánek od:", "sleep");
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

            {/*
            <Pressable style={styles.deleteModeButton} onPress={clearState}>
              <Text style={styles.buttonText}>Vymazat stav</Text>
            </Pressable> 
            */}

          </View>
        )}

        <View>
          {grouped.map(({ date, totalSleepMinutes, records }, groupIdx) => {
            const sortedAsc = [...records].sort((a, b) => a.ts - b.ts);
            const sleepNumbers = new Map<number, number>();
            let sleepCounter = 1;
            sortedAsc.forEach((r) => {
              if (r.state === "sleep") {
                sleepNumbers.set(r.ts, sleepCounter++);
              }
            });
            return (
              <View key={`group-${date}-${groupIdx}`} style={styles.dateGroup}>
                <View style={styles.row}>
                  {isEditMode && (
                    <EditPencil
                      targetPath={`/actions/sleep-edit?date=${encodeURIComponent(date)}`}
                      color="#993769"
                    />
                  )}
                  <Text style={styles.dateTitle}>{date}</Text>
                </View>
                  {records.map((rec, recIdx) => {
                    let displayText = "";

                    if (rec.state === "sleep") {
                      const number = sleepNumbers.get(rec.ts);
                      displayText = `${number}. spánek od: ${rec.time}${rec.extra ?? ""}`;
                    } else {
                      displayText = `Vzhůru od: ${rec.time}${rec.extra ?? ""}`;
                    }

                    return (
                      <Text
                        key={`rec-${date}-${rec.time}-${recIdx}`}
                        style={styles.recordText}
                      >
                        {displayText}
                      </Text>
                    );
                  })}

                  <Text style={styles.totalText}>
                    Celkem spánku: {Math.floor(totalSleepMinutes / 60)} h {totalSleepMinutes % 60} m
                  </Text>
                </View>
              );
        })}
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
    borderColor: "#bf5f82",
  },
  counterText: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 10,
   
  },
  /*deleteModeButton: {
    backgroundColor: "#bf5f82",
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
  }*/
  /*buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },*/
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
  dateGroup: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
