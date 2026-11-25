import { showAlert } from "@/components/showAlert";
import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import { formatDuration, toTimestamp } from "@/components/HelperFunctions";
import { formatDateToCzech, formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import Note from "@/components/Note";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ChartColumn, Eye, EyeClosed } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Sleep() {
  const [records, setRecords] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [mode, setMode] = useState<"awake" | "sleep" | "">("");
  const [modeStart, setModeStart] = useState<string | null>(null);
  const [minutesSinceMode, setMinutesSinceMode] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { selectedChildId, selectedChild, updateSleepDayRecord, isDataLoaded } = useChild();

  // RESET STAVU
  const clearState = async () => {
    if (!selectedChildId || !selectedChild) return;
    
    const today = formatDateLocal(new Date());
    const todaysCleanRecords = (selectedChild.sleepRecords || [])
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
      // Předáváme null jako 4. parametr pro vynulování běžícího timeru na serveru/v cache
      await updateSleepDayRecord(selectedChildId, today, todaysCleanRecords, null);
      
      // Reset lokálních stavů v komponentě
      setMode("");
      setModeStart(null);
      setMinutesSinceMode(null);
    } catch {
      showAlert("Chyba", "Nepodařilo se resetovat stav.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NAČTENÍ DAT A SYNCHRONIZACE
  useFocusEffect(
    useCallback(() => {
      if (!isDataLoaded || !selectedChild || !selectedChild.sleepRecords) return;

      setRecords(
        selectedChild.sleepRecords.map((rec) => ({
          ...rec,
          label: rec.state === "sleep" ? "Spánek od:" : "Vzhůru od:",
        }))
      );

      if (selectedChild?.currentModeSleep) {
        const { mode, start } = selectedChild?.currentModeSleep;
        setMode(mode as "awake" | "sleep");
        setModeStart(start);
        const diff = Math.floor((Date.now() - new Date(start).getTime()) / 60000);
        setMinutesSinceMode(diff);
      } else {
        setMode("");
        setModeStart(null);
        setMinutesSinceMode(null);
      }
    }, [selectedChild, isDataLoaded])
  );

  // TICKER
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (mode && modeStart) {
      const tick = () => {
        const diffMinutes = Math.floor((Date.now() - new Date(modeStart).getTime()) / 60000);
        setMinutesSinceMode(diffMinutes);
      };
      tick();
      interval = setInterval(tick, 60000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [mode, modeStart]);

  // POMOCNÁ FUNKCE PRO KONTROLU
  const getLastMode = (): "awake" | "sleep" | null => {
    return (selectedChild?.currentModeSleep?.mode as "awake" | "sleep") ?? null;
  };
  
  // PŘIDÁNÍ ZÁZNAMU
  const addRecord = async (newMode: "awake" | "sleep") => {
    if (!selectedChildId || !selectedChild) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const date = formatDateLocal(now);
    const startISO = now.toISOString();

    const newRec = {
      id: `local-${Date.now()}`, 
      child_id: selectedChildId,
      date,
      time,
      state: newMode,
      note: ""
    };

    // 1. Optimistický update lokálního stavu pro okamžitou odezvu v UI
    setRecords(prev => [...prev, newRec]);

    // 2. Příprava polí pro odeslání (pouze záznamy z daného dne)
    const allRecords = [...(selectedChild.sleepRecords || []), newRec];
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
      const newTimerState = { mode: newMode, start: startISO };

      // Okamžitě zapneme čítač v UI
      setMode(newMode);
      setModeStart(startISO);
      setMinutesSinceMode(0);

      await updateSleepDayRecord(selectedChildId, date, todaysSyncData, newTimerState);
    } catch (error) {
      console.error("Chyba při ukládání spánku:", error);
      showAlert("Chyba", "Nepodařilo se synchronizovat záznam se serverem.");
      setRecords(prev => prev.filter(r => r.id !== newRec.id));
    }
  };

  // VÝPOČET GROUPED DAT (PRO ZOBRAZENÍ)
  const grouped = useMemo(() => {
    if (!records.length) return [];

    // 1. Seskupení podle data 
    const groupedMap = records.reduce((acc: Record<string, any[]>, rec: any) => {
      if (!acc[rec.date]) acc[rec.date] = [];
      acc[rec.date].push({ ...rec, ts: toTimestamp(rec.date, rec.time) });
      return acc;
    }, {});

    // 2. Transformace na pole skupin
    const groups = Object.entries(groupedMap)
      .map(([date, recs]) => {
        const sortedAsc = [...recs].sort((a, b) => a.ts - b.ts);
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
          const label = curr.state === "sleep" 
            ? `${sleepCounter++}. spánek od: ${curr.time}` 
            : `Vzhůru od: ${curr.time}`;
          return { ...curr, label, extra };
        });

        return {
          date,
          totalSleepMinutes,
          nightSleepMinutes: 0,
          records: enhanced.reverse(),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Seřazení dnů sestupně

    // 3. LOGIKA NOČNÍHO SPÁNKU 
    for (let i = 0; i < groups.length - 1; i++) {
      const today = groups[i];     
      const yesterday = groups[i + 1]; 

      // Poslední záznam včerejška musí být "sleep"
      const lastSleepYesterday = [...yesterday.records]
        .sort((a, b) => a.ts - b.ts)
        .filter(r => r.state === "sleep")
        .pop();

      // První záznam dneška musí být "awake"
      const firstAwakeToday = [...today.records]
        .sort((a, b) => a.ts - b.ts)
        .find(r => r.state === "awake");

      if (lastSleepYesterday && firstAwakeToday) {
        const nightMinutes = Math.floor((firstAwakeToday.ts - lastSleepYesterday.ts) / 60000);
        
        // Pokud interval dává smysl (včerejší spánek < dnešní probuzení)
        if (nightMinutes > 0) {
          // Připočteme spánek ke dni, kdy ZAČAL (včerejšek)
          yesterday.totalSleepMinutes += nightMinutes;
          yesterday.nightSleepMinutes = nightMinutes; 

          // Aktualizace textového popisku u posledního spánku včerejška
          const recIdx = yesterday.records.findIndex(r => r.id === lastSleepYesterday.id);
          if (recIdx !== -1) {
            yesterday.records[recIdx].extra = ` → ${formatDuration(nightMinutes)}`;
          }
        }
      }
    }

    return groups;
  }, [records]);

  if (!isDataLoaded || !selectedChild || isSubmitting) {
    return (
      <MainScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Načítám data o spánku...</Text>
        </View>
      </MainScreenContainer>
    );
  }

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
              styles.button, { backgroundColor: "#fff" },
              mode === "awake" && styles.eyeButtonSelected,
            ]}
            onPress={() => {
              if (getLastMode() === "awake") {
                showAlert(`${selectedChild?.name} už je vzhůru.`);
                return;
              }
              addRecord("awake");
            }}
          >
            <Eye size={28}/>
          </Pressable>
          <Pressable
            style={[
              styles.button, { backgroundColor: "#000" },
              mode === "sleep" && styles.eyeButtonSelected,
            ]}
            onPress={() => {
              if (getLastMode() === "sleep") {
                showAlert(`${selectedChild?.name} už spí.`);
                return;
              }
              addRecord("sleep");
            }}
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
          {grouped.map(({ date, totalSleepMinutes, nightSleepMinutes, records }) => {
            const dayOnlyMinutes = totalSleepMinutes - (nightSleepMinutes || 0);

            return (
              <GroupSection key={date}>
                <View style={styles.row}>
                  {isEditMode && (
                    <EditPencil
                      targetPath={`/actions/sleep-edit?date=${encodeURIComponent(date)}`}
                      color={COLORS.primary}
                    />
                  )}
                  <Text style={styles.dateTitle}>{formatDateToCzech(date)}</Text>
                </View>

                {records.map((rec) => (
                  <View key={rec.id} style={styles.row}>
                    <Note 
                      initialText={rec.note} 
                      onSave={async (newNoteText) => {
                        if (!selectedChildId || !selectedChild || !selectedChild.sleepRecords) return;
    
                        // 1. Vytvoření nového pole záznamů
                        const updatedRecords = selectedChild.sleepRecords.map(r => 
                          r.id === rec.id ? { ...r, note: newNoteText } : r
                        );                        
                        setRecords(updatedRecords);                        
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
                          // 4. Odeslání očištěných dat do provideru
                          await updateSleepDayRecord(selectedChildId, rec.date, daySyncData);
                        } catch {
                          showAlert("Chyba", "Nepodařilo se uložit poznámku.");
                        }
                      }} 
                    />
                    <Text key={rec.id || `${rec.date}-${rec.time}`} style={styles.recordText}>
                      {rec.label}{rec.extra ?? ""}
                    </Text>
                  </View>
                ))}

                <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 4 }}>
                  {nightSleepMinutes > 0 && (
                    <Text style={styles.totalText}>
                      Denní spánek: {Math.floor(dayOnlyMinutes / 60)}h {dayOnlyMinutes % 60}m
                    </Text>
                  )}
                  
                  <Text style={[styles.totalText, { fontWeight: 'bold' }]}>
                    Celkem spánku: {Math.floor(totalSleepMinutes / 60)}h {totalSleepMinutes % 60}m
                  </Text>
                </View>
              </GroupSection>
            );
          })}
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