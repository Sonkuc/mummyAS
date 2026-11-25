import { isGuestMode } from "@/lib/guest";
import { showAlert } from "@/components/showAlert";
import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import { formatDuration, toTimestamp } from "@/components/HelperFunctions";
import { formatDateToCzech, formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import Note from "@/components/Note";
import type { DisplayBreastfeedingRecord } from "@/components/storage/interfaces";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, ChartColumn, Milk, MilkOff } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Breastfeeding() {
  const [records, setRecords] = useState<DisplayBreastfeedingRecord[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [minutesSinceStart, setMinutesSinceStart] = useState<number | null>(null);
  const [minutesSinceStop, setMinutesSinceStop] = useState<number | null>(null);
  const [mode, setMode] = useState<"start" | "stop" | "">("");
  const [modeStart, setModeStart] = useState<string | null>(null);
  const [breastSide, setBreastSide] = useState<"left" | "right">("right");
  const BREAST_SIDE_KEY = "breastSideMode";

  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  // Využití isDataLoaded z globálního ChildContextu
  const { selectedChildId, selectedChild, updateBreastfeedingDayRecord, isDataLoaded } = useChild();
  
  const clearState = async () => {
    if (!selectedChildId || !selectedChild) return;

    const today = formatDateLocal(new Date());
    const todaysCleanRecords = (selectedChild.breastfeedingRecords || [])
      .filter((r) => r.date === today)
      .map(({ id, date: d, time: t, state: s, note: n }) => ({
        id,
        date: d,
        time: t,
        state: s,
        note: n || undefined
      }));

    try {
      setIsSubmitting(true);
      await updateBreastfeedingDayRecord(selectedChildId, today, todaysCleanRecords, null);
      
      setMode("");
      setModeStart(null);
      setMinutesSinceStart(null);
      setMinutesSinceStop(null);
    } catch (error) {
      console.error("Chyba při resetu stavu:", error);
      showAlert("Chyba", "Nepodařilo se resetovat stav.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(BREAST_SIDE_KEY);
        if (stored) {
          setBreastSide(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Chyba při načítání breastSide:", e);
      } finally {
        setIsStorageLoading(false); 
      }
    })();
  }, []);

  const toggleBreastSide = async () => {
    const newSide = breastSide === "left" ? "right" : "left";
    setBreastSide(newSide);
    try {
      if (!isGuestMode()) await AsyncStorage.setItem(BREAST_SIDE_KEY, JSON.stringify(newSide));
    } catch (e) {
      console.error("Chyba při ukládání breastSide:", e);
    }
  };

  const addRecord = async (newMode: "start" | "stop") => {
    if (!selectedChildId || !selectedChild) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const time = `${hours}:${minutes}`;
    const date = formatDateLocal(now);
    const localISOStart = `${date}T${time}:00.000Z`;

    const newRec: DisplayBreastfeedingRecord = {
      id: `local-${Date.now()}`,
      child_id: selectedChildId,
      date,
      time,
      state: newMode,
      label: newMode === "start" ? "Začátek kojení:" : "Konec kojení:",
      note: ""
    };

    // Optimistický update lokálního stavu, aby aplikace reagovala okamžitě i offline
    setRecords(prev => [...prev, newRec]);

    const allRecords = [...(selectedChild.breastfeedingRecords || []), newRec];
    const todaysSyncData = allRecords
      .filter((r) => r.date === date)
      .map(({ id, date: d, time: t, state: s, note: n }) => ({
        id,
        date: d,
        time: t,
        state: s,
        note: n || undefined
      }));

    try {
      const newTimerState = { mode: newMode, start: localISOStart };

      setMode(newMode);
      setModeStart(localISOStart);
      
      if (newMode === "stop") {
        setMinutesSinceStart(null);
        setMinutesSinceStop(0);
      } else {
        setMinutesSinceStop(null);
        setMinutesSinceStart(0);
      }

      await updateBreastfeedingDayRecord(selectedChildId, date, todaysSyncData, newTimerState);
    } catch (error) {
      console.error("Chyba při ukládání kojení:", error);
      showAlert("Chyba", "Nepodařilo se synchronizovat záznam se serverem.");
      setRecords(prev => prev.filter(r => r.id !== newRec.id));
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isDataLoaded || !selectedChild || !selectedChild.breastfeedingRecords) return;

      setRecords(
        selectedChild.breastfeedingRecords.map((rec) => ({
          ...rec,
          label: rec.state === "start" ? "Začátek kojení:" : "Konec kojení:",
        }))
      );

      let activeMode: "start" | "stop" | "" = "";
      let startTimeMs: number | null = null;

      if (selectedChild.currentModeFeed === null) {
        activeMode = "";
        startTimeMs = null;
      } else if (selectedChild.currentModeFeed && selectedChild.currentModeFeed.start) {
        activeMode = selectedChild.currentModeFeed.mode as "start" | "stop";
        const cleanStart = selectedChild.currentModeFeed.start.replace("Z", "");
        startTimeMs = Date.parse(cleanStart);
      } else if (selectedChild.breastfeedingRecords.length > 0) {
        const sortedRecs = [...selectedChild.breastfeedingRecords].sort(
          (a, b) => toTimestamp(a.date, a.time) - toTimestamp(b.date, b.time)
        );
        const lastRec = sortedRecs[sortedRecs.length - 1];
        if (lastRec) {
          activeMode = lastRec.state as "start" | "stop";
          startTimeMs = toTimestamp(lastRec.date, lastRec.time);
        }
      }

      if (activeMode && startTimeMs && !isNaN(startTimeMs)) {
        const nowTime = Date.now();
        let diff = Math.floor((nowTime - startTimeMs) / 60000);

        if (diff < -5 || diff > 1440) {
          setMode("");
          setModeStart(null);
          setMinutesSinceStart(null);
          setMinutesSinceStop(null);
          return;
        }

        if (diff < 0) diff = 0;

        setMode(activeMode);
        setModeStart(new Date(startTimeMs).toISOString());

        if (activeMode === "stop") {
          setMinutesSinceStop(diff);
          setMinutesSinceStart(null);
        } else if (activeMode === "start") {
          setMinutesSinceStart(diff);
          setMinutesSinceStop(null);
        }
      } else {
        setMode("");
        setModeStart(null);
        setMinutesSinceStart(null);
        setMinutesSinceStop(null);
      }
    }, [selectedChild, isDataLoaded])
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (mode && modeStart) {
      const tick = () => {
        const startTime = Date.parse(modeStart);
        if (!isNaN(startTime)) {
          let diffMinutes = Math.floor((Date.now() - startTime) / 60000);
          if (diffMinutes < 0) diffMinutes = 0;

          if (mode === "stop") setMinutesSinceStop(diffMinutes);
          if (mode === "start") setMinutesSinceStart(diffMinutes);
        }
      };
      tick();
      interval = setInterval(tick, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, modeStart]);

  const grouped = useMemo(() => {
    if (!records.length) return [];

    const allSorted = [...records]
      .map(r => ({ ...r, ts: toTimestamp(r.date, r.time) }))
      .sort((a, b) => a.ts - b.ts);

    const dayMap: Record<string, { date: string; totalFeedMinutes: number; records: any[] }> = {};
    const feedCounters: Record<string, number> = {};

    for (let i = 0; i < allSorted.length; i++) {
      const curr = allSorted[i];
      
      if (!dayMap[curr.date]) {
        dayMap[curr.date] = { date: curr.date, totalFeedMinutes: 0, records: [] };
        feedCounters[curr.date] = 1;
      }

      let extra = "";
      let label = "";

      if (curr.state === "start") {
        const nextStop = allSorted.slice(i + 1).find(r => r.state === "stop");
        
        if (nextStop) {
          const minutes = Math.floor((nextStop.ts - curr.ts) / 60000);
          if (minutes > 0) {
            dayMap[curr.date].totalFeedMinutes += minutes;
            extra = ` → ${formatDuration(minutes)}`;
          }
        }
        label = `Začátek ${feedCounters[curr.date]++}. kojení: ${curr.time}`;
        dayMap[curr.date].records.push({ ...curr, label, extra });
      } else {
        label = `Konec kojení: ${curr.time}`;
        dayMap[curr.date].records.push({ ...curr, label });
      }
    }

    return Object.values(dayMap)
      .map(day => ({
        ...day,
        records: day.records.sort((a, b) => b.ts - a.ts)
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const getLastMode = (): "start" | "stop" | null => {
    return (selectedChild?.currentModeFeed?.mode as "start" | "stop") ?? null;
  };

  if (isStorageLoading || !selectedChild || !isDataLoaded || isSubmitting) {
    return (
      <MainScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Načítám data o kojení...</Text>
        </View>
      </MainScreenContainer>
    );
  }

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/breastfeeding-add" />
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Kojení</Title>
        <View style={styles.buttonsRow}>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: "#fff" },
              mode === "start" && styles.milkButtonSelected,
            ]}
            onPress={() => {
              if (getLastMode() === "start") {
                showAlert(`${selectedChild?.name} už se kojí.`);
                return;
              }
              addRecord("start");
            }}
          >
            <Milk size={28} />
          </Pressable>

          <Pressable
            style={[
              styles.button,
              { backgroundColor: "#000" },
              mode === "stop" && styles.milkButtonSelected,
            ]}
            onPress={() => {
              if (getLastMode() === "stop") {
                showAlert(`${selectedChild?.name} se nekojí.`);
                return;
              }
              addRecord("stop");
            }}
          >
            <MilkOff color="white" size={28} />
          </Pressable>
        </View>

        {mode && (
          <View>
            <Text style={styles.counterText}>
              {mode === "stop" && minutesSinceStop !== null &&
                `${formatDuration(minutesSinceStop)} od posledního kojení`}
              {mode === "start" && minutesSinceStart !== null &&
                `Kojí se ${formatDuration(minutesSinceStart)}`}
            </Text>
            <Pressable style={styles.deleteModeButton} onPress={clearState}>
              <Text style={styles.buttonText}>Reset</Text>
            </Pressable>
          </View>
        )}
        <View style={[styles.buttonsRow, {marginTop: 20 }]}>
          <Text style={styles.counterText}>
            Teď je na řadě
          </Text>
          <Pressable style={styles.breastButton} onPress={toggleBreastSide}>
            {breastSide === "left" && <ArrowLeft color="white" size={28} />}
            {breastSide === "right" && <ArrowRight color="white" size={28} />}
          </Pressable>
          <Text style={styles.counterText}>
            prso.
          </Text>
        </View>

        {grouped.map(({ date, totalFeedMinutes, records }) => (
          <GroupSection key={date}>
            <View style={styles.row}>
              {isEditMode && (
                <EditPencil
                  targetPath={`/actions/breastfeeding-edit?date=${encodeURIComponent(date)}`}
                  color={COLORS.primary}
                />
              )}
              <Text style={styles.dateTitle}>{formatDateToCzech(date)}</Text>
            </View>
            {records.map((rec) => (
              <View key={`${rec.id}-${rec.state}-${rec.time}`} style={styles.row}>
                <Note 
                  initialText={rec.note} 
                  onSave={async (newNoteText) => {
                    // 1. Bezpečnostní pojistka
                    if (!selectedChildId || !selectedChild || !selectedChild.breastfeedingRecords) return;

                    // 2. Vytvoření nového pole se změněnou poznámkou
                    const updatedRecords = selectedChild.breastfeedingRecords.map(r => 
                      r.id === rec.id ? { ...r, note: newNoteText } : r
                    );
                    
                    // 3. Příprava očištěných dat POUZE pro den, kterého se poznámka týká
                    const daySyncData = updatedRecords
                      .filter(r => r.date === rec.date)
                      .map(({ id, date: d, time: t, state: s, note: n }) => ({
                        id,
                        date: d,
                        time: t,
                        state: s,
                        note: n || undefined
                      }));

                    try {
                      if (!selectedChildId) {
                        showAlert("Chyba", "Dítě není vybráno.");
                        return;
                      }
                      await updateBreastfeedingDayRecord(selectedChildId, rec.date, daySyncData);
                    } catch (err) {
                      console.error("Chyba při ukládání poznámky kojení:", err);
                      showAlert("Chyba", "Nepodařilo se uložit poznámku.");
                    }
                  }} 
                />
                <Text style={styles.recordText}>
                  {rec.label} {rec.extra ?? ""}
                </Text>
              </View>
            ))}
            <Text style={styles.totalText}>
              Celkový čas kojení: {
                totalFeedMinutes === 0 
                  ? "0 m" 
                  : totalFeedMinutes % 60 === 0
                    ? `${Math.floor(totalFeedMinutes / 60)} h`
                    : `${Math.floor(totalFeedMinutes / 60)} h ${totalFeedMinutes % 60} m`
              }
            </Text>
          </GroupSection>
        ))}
      </ScrollView>

      <Pressable
        style={styles.statisticButton}
        onPress={() => 
          router.push({pathname: "/actions/breastfeeding-statistic"})
        }
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
  milkButtonSelected: {
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
  breastButton: {
    width: 35,
    height: 35,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  notePreview: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});