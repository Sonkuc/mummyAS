import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import { formatDuration, toTimestamp } from "@/components/HelperFunctions";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import Note from "@/components/Note";
import * as api from "@/components/storage/api";
import type { BreastfeedingRecord, Child } from "@/components/storage/interfaces";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, ChartColumn, Milk, MilkOff } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import uuid from "react-native-uuid";

type DisplayBreastfeedingRecord = BreastfeedingRecord & { label?: string, extra?: string; };

export default function Breastfeeding() {
  const [records, setRecords] = useState<DisplayBreastfeedingRecord[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [minutesSinceStart, setMinutesSinceStart] = useState<number | null>(null);
  const [minutesSinceStop, setMinutesSinceStop] = useState<number | null>(null);
  const [mode, setMode] = useState<"start" | "stop" | "">("");
  const [modeStart, setModeStart] = useState<number | null>(null);
  const [brestSide, setBrestSide] = useState<"left" | "right">("right");
  const BREST_SIDE_KEY = "brestSideMode";

  const router = useRouter();
  const { selectedChildId, selectedChild, reloadChildren, updateChild } = useChild();
  
  const clearState = async () => {
    if (!selectedChildId || !selectedChild) return; 

    try {
      // Kopie dítěte, vynulován currentModeFeed
      const updatedChild = { 
        ...selectedChild, 
        currentModeFeed: null 
      };

      await api.updateChild(selectedChildId, updatedChild);
        
      // Lokální reset
      setMode("");
      setModeStart(null);
      setMinutesSinceStart(null);
      setMinutesSinceStop(null);
      
      await reloadChildren();
    } catch (error) {
      Alert.alert("Chyba", "Nepodařilo se resetovat stav.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(BREST_SIDE_KEY);
        if (stored) {
          setBrestSide(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Chyba při načítání brestSide:", e);
      }
    })();
  }, []);

  const toggleBrestSide = async () => {
    const newSide = brestSide === "left" ? "right" : "left";
    setBrestSide(newSide);
    try {
      await AsyncStorage.setItem(BREST_SIDE_KEY, JSON.stringify(newSide));
    } catch (e) {
      console.error("Chyba při ukládání brestSide:", e);
    }
  };

  const addRecord = async (label: string, newMode: "start" | "stop") => {
    if (!selectedChildId || !selectedChild) return;

    const now = new Date();
    const time = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    const date = now.toISOString().slice(0, 10);
    const startTimestamp = Date.now();

    // 1. Vytvoříme nový záznam
    const newRec: BreastfeedingRecord = {
      id: uuid.v4().toString(), // Použij uuid pro unikátní ID v offline režimu
      date,
      time,
      state: newMode,
    };

    // 2. Připravíme aktualizovaný objekt dítěte
    const updatedChild: Child = {
      ...selectedChild,
      // Přidáme záznam k existujícím
      breastfeedingRecords: [...(selectedChild.breastfeedingRecords || []), newRec],
      // Aktualizujeme live stav
      currentModeFeed: { mode: newMode, start: startTimestamp }
    };

    try {
      // 3. Použijeme updateChild z Provideru! 
      // Ten se postará o uložení do AsyncStorage a synchronizaci, až budeš online.
      await updateChild(updatedChild);

      // Lokální UI stavy pro čítač (ty zůstávají stejné)
      setMode(newMode);
      setModeStart(startTimestamp);
      if (newMode === "stop") setMinutesSinceStart(null);
      if (newMode === "start") setMinutesSinceStop(null);

    } catch (error) {
      console.error("Chyba při ukládání:", error);
      Alert.alert("Chyba", "Nepodařilo se uložit záznam.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (selectedChild?.breastfeedingRecords) {
        setRecords(
          (selectedChild.breastfeedingRecords ?? []).map((rec) => ({
            ...rec,
            label: rec.state === "start" ? "Začátek kojení:" : "Konec kojení:",
          }))
        );
      }

      if (selectedChild?.currentModeFeed) {
        const { mode, start } = selectedChild.currentModeFeed;
        setMode(mode);
        setModeStart(start);

        const diff = Math.floor((Date.now() - start) / 60000);
        if (mode === "stop") setMinutesSinceStop(diff);
        if (mode === "start") setMinutesSinceStart(diff);
      }
    }, [selectedChild])
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (mode && modeStart) {
      const tick = () => {
        const diffMinutes = Math.floor((Date.now() - modeStart) / 60000);
        if (mode === "stop") setMinutesSinceStop(diffMinutes);
        if (mode === "start") setMinutesSinceStart(diffMinutes);
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

    // 1. Všechny záznamy seřadíme chronologicky napříč všemi dny
    const allSorted = [...records]
      .map(r => ({ ...r, ts: toTimestamp(r.date, r.time) }))
      .sort((a, b) => a.ts - b.ts);

    const dayMap: Record<string, { date: string; totalFeedMinutes: number; records: any[] }> = {};
    const feedCounters: Record<string, number> = {};

    // 2. Procházíme seřazené záznamy a párujeme je
    for (let i = 0; i < allSorted.length; i++) {
      const curr = allSorted[i];
      
      // Inicializace dne v mapě (pokud ještě neexistuje)
      if (!dayMap[curr.date]) {
        dayMap[curr.date] = { date: curr.date, totalFeedMinutes: 0, records: [] };
        feedCounters[curr.date] = 1;
      }

      let extra = "";
      let label = "";

      if (curr.state === "start") {
        // Hledáme k tomuto startu následující stop (i kdyby byl v jiný den)
        const nextStop = allSorted.slice(i + 1).find(r => r.state === "stop");
        
        if (nextStop) {
          const minutes = Math.floor((nextStop.ts - curr.ts) / 60000);
          if (minutes > 0) {
            // Započítáme minuty ke dni, kdy kojení ZAČALO
            dayMap[curr.date].totalFeedMinutes += minutes;
            extra = ` → ${formatDuration(minutes)}`;
          }
        }
        label = `Začátek ${feedCounters[curr.date]++}. kojení: ${curr.time}`;
        dayMap[curr.date].records.push({ ...curr, label, extra });
      } else {
        // U stop záznamu jen vytvoříme popisek a přidáme ho k danému dni
        label = `Konec kojení: ${curr.time}`;
        dayMap[curr.date].records.push({ ...curr, label });
      }
    }

    // 3. Převedeme mapu na pole a seřadíme dny sestupně (nejnovější nahoře)
    return Object.values(dayMap)
      .map(day => ({
        ...day,
        // Záznamy v rámci dne seřadíme sestupně podle času
        records: day.records.sort((a, b) => b.ts - a.ts)
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const getLastMode = (): "start" | "stop" | null => {
    // 1. Priorita je live stav z backendu/contextu (ten je globální)
    if (selectedChild?.currentModeFeed?.mode) {
      return selectedChild.currentModeFeed.mode;
    }
    
    // 2. Fallback na poslední uložený záznam (seřazený globálně)
    const allRecs = selectedChild?.breastfeedingRecords ?? [];
    if (allRecs.length === 0) return null;
    
    const last = [...allRecs].sort((a, b) => 
      toTimestamp(a.date, a.time) - toTimestamp(b.date, b.time)
    )[allRecs.length - 1];
    
    return last?.state ?? null;
  };

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
                Alert.alert(`${selectedChild?.name} už se kojí.`);
                return;
              }
              addRecord("Začátek kojení:", "start");
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
                Alert.alert(`${selectedChild?.name} se nekojí.`);
                return;
              }
              addRecord("Konec kojení:", "stop");
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
          <Pressable style={styles.breastButton} onPress={toggleBrestSide}>
            {brestSide === "left" && <ArrowLeft color="white" size={28} />}
            {brestSide === "right" && <ArrowRight color="white" size={28} />}
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
              <View key={rec.id} style={styles.row}>
                <Note 
                  initialText={rec.note} 
                  onSave={async (newNoteText) => {
                    // 1. Bezpečnostní pojistka
                    if (!selectedChild || !selectedChild.breastfeedingRecords) return;

                    // 2. Vytvoření nového pole záznamů
                    const updatedRecords = selectedChild.breastfeedingRecords.map(r => 
                      r.id === rec.id ? { ...r, note: newNoteText } : r
                    );
                    
                    // 3. Odeslání na server/provider
                    try {
                      await updateChild({
                        ...selectedChild,
                        breastfeedingRecords: updatedRecords
                      });
                    } catch (err) {
                      Alert.alert("Chyba", "Nepodařilo se uložit poznámku.");
                    }
                  }} 
                />
                <Text style={styles.recordText}>
                  {rec.label} {rec.extra ?? ""}
                </Text>
              </View>
            ))}
            <Text style={styles.totalText}>
              Celkový čas kojení: {Math.floor(totalFeedMinutes / 60)} h {totalFeedMinutes % 60} m
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
  }
});