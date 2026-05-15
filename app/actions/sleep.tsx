import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import { formatDuration, toTimestamp } from "@/components/HelperFunctions";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import Note from "@/components/Note";
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
  const [modeStart, setModeStart] = useState<string | null>(null);
  const [minutesSinceMode, setMinutesSinceMode] = useState<number | null>(null);

  const router = useRouter();
  const { selectedChildId, selectedChild, updateChild } = useChild();

  // RESET STAVU
  const clearState = async () => {
    if (!selectedChildId || !selectedChild) return;
    
    const updatedChild = {
      ...selectedChild,
      currentModeSleep: null 
    };

    try {
      await updateChild(updatedChild);
      
      // Reset lokálních stavů v komponentě
      setMode("");
      setModeStart(null);
      setMinutesSinceMode(null);
    } catch (error) {
      Alert.alert("Chyba", "Nepodařilo se resetovat stav.");
    }
  };

  // NAČTENÍ DAT A SYNCHRONIZACE
  useFocusEffect(
    useCallback(() => {
      if (selectedChild?.sleepRecords) {
        setRecords(
          selectedChild.sleepRecords.map((rec) => ({
            ...rec,
            label: rec.state === "sleep" ? "Spánek od:" : "Vzhůru od:",
          }))
        );
      }

      if (selectedChild?.currentModeSleep) {
        const { mode, start } = selectedChild?.currentModeSleep;
        setMode(mode as "awake" | "sleep");
        setModeStart(start);
        const diff = Math.floor((Date.now() - new Date(start).getTime()) / 60000);
        setMinutesSinceMode(diff);
      }
    }, [selectedChild])
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
    if (selectedChild?.currentModeSleep?.mode) {
      return selectedChild.currentModeSleep.mode as "awake" | "sleep";
    }
    const last = selectedChild?.sleepRecords?.[selectedChild.sleepRecords.length - 1];
    return (last?.state as "awake" | "sleep") ?? null;
  };

  // PŘIDÁNÍ ZÁZNAMU
  const addRecord = async (newMode: "awake" | "sleep") => {
    if (!selectedChildId || !selectedChild) return;

    const now = new Date();
    const time = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    const date = now.toISOString().slice(0, 10);
    const startISO = now.toISOString();

    // 2. Vytvoříme lokální záznam 
    const newRec = {
      id: `local-${Date.now()}`, 
      child_id: selectedChildId,
      date,
      time,
      state: newMode,
    };

    // 3. Připravíme aktualizované dítě
    const updatedChild = {
      ...selectedChild,
      // Přidáme záznam k existujícím
      sleepRecords: [...(selectedChild.sleepRecords || []), newRec],
      // Nastavíme live režim pro čítač
      currentModeSleep: { mode: newMode, start: startISO }
    };

    try {
      // 4. Magický update, který funguje offline:
      // Uloží do paměti mobilu a přidá do fronty pro odeslání
      await updateChild(updatedChild);

      // Aktualizace lokálních stavů v komponentě pro okamžitý ticker
      setMode(newMode);
      setModeStart(startISO);
      setMinutesSinceMode(0);
    } catch (error) {
      console.error("Chyba při ukládání spánku:", error);
      // Díky updateChild uživatel chybu neuvidí, data jsou v lokální cache
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
                Alert.alert(`${selectedChild?.name} už je vzhůru.`);
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
                Alert.alert(`${selectedChild?.name} už spí.`);
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
                        // 1. Bezpečnostní pojistka
                        if (!selectedChild || !selectedChild.sleepRecords) return;
    
                        // 2. Vytvoření nového pole záznamů
                        const updatedRecords = selectedChild.sleepRecords.map(r => 
                          r.id === rec.id ? { ...r, note: newNoteText } : r
                        );
                        
                        // 3. Odeslání na server/provider
                        try {
                          await updateChild({
                            ...selectedChild,
                            sleepRecords: updatedRecords
                          });
                        } catch (err) {
                          Alert.alert("Chyba", "Nepodařilo se uložit poznámku.");
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
});