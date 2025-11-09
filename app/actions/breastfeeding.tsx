import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import { clearStateGeneric, formatDuration, toTimestamp } from "@/components/SleepBfFunctions";
import type { BreastfeedingRecord } from "@/components/storage/SaveChildren";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, ChartColumn, Milk, MilkOff } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type DisplayBreastfeedingRecord = BreastfeedingRecord & { label?: string };

type GroupedFeed = {
  date: string;
  totalFeedMinutes: number;
  records: (DisplayBreastfeedingRecord & { extra?: string })[];
};

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
  const { selectedChild, allChildren, selectedChildIndex, saveAllChildren } = useChild();

  const clearState = () =>
      clearStateGeneric("feed", setMode, setMinutesSinceStart, setMinutesSinceStop, setModeStart, selectedChildIndex, allChildren, saveAllChildren);

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
    if (!selectedChild) return;

    if (newMode === "stop") setMinutesSinceStart(null);
    if (newMode === "start") setMinutesSinceStop(null);

    const now = new Date();
    const time = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    const date = now.toISOString().slice(0, 10); // vždy ISO YYYY-MM-DD

    const newRecord: DisplayBreastfeedingRecord = { date, time, state: newMode};

    setRecords((prev) => [...prev, newRecord]);

    const startTimestamp = toTimestamp(date, time);
    setMode(newMode);
    setModeStart(startTimestamp);

    if (selectedChildIndex !== null) {
      const updated = [...allChildren];
      updated[selectedChildIndex].breastfeedingRecords = [
        ...(updated[selectedChildIndex].breastfeedingRecords || []),
        { date, time, state: newMode },
      ];
      updated[selectedChildIndex].currentModeFeed = {
        mode: newMode,
        start: startTimestamp,
      };
      saveAllChildren(updated);
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

    // Seskupení záznamů podle data
    const groupedByDate: Record<string, (DisplayBreastfeedingRecord & { ts: number })[]> = {};
    records.forEach((rec) => {
      const ts = toTimestamp(rec.date, rec.time);
      if (!groupedByDate[rec.date]) groupedByDate[rec.date] = [];
      groupedByDate[rec.date].push({ ...rec, ts });
    });

    return Object.entries(groupedByDate)
      .map(([date, recs]) => {
        const sortedAsc = [...recs].sort((a, b) => a.ts - b.ts);

        let totalFeedMinutes = 0;
        const enhanced: (DisplayBreastfeedingRecord & { ts: number; extra?: string })[] = [];
        let feedCounter = 1;

        for (let i = 0; i < sortedAsc.length; i++) {
          const curr = sortedAsc[i];
          const next = sortedAsc[i + 1];
          let extra = "";

          if (next && curr.state === "start" && next.state === "stop") {
            const minutes = Math.floor((next.ts - curr.ts) / 60000);
            if (minutes > 0) {
              totalFeedMinutes += minutes;
              extra = ` → ${formatDuration(minutes)}`;
            }
          }

          const label =
            curr.state === "stop"
              ? `Konec kojení: ${curr.time}`
              : `Začátek ${feedCounter++}. kojení: ${curr.time}`;

          enhanced.push({ ...curr, label, extra });
        }

        // Seřadíme sestupně pro UI
        const sortedDesc = [...enhanced].sort((a, b) => b.ts - a.ts);

        return {
          date,
          totalFeedMinutes,
          records: sortedDesc,
        };
      })
      .sort((a, b) => {
        const ta = toTimestamp(a.date, "23:59");
        const tb = toTimestamp(b.date, "23:59");
        return tb - ta;
      });
  }, [records]);

  useEffect(() => {
    if (selectedChildIndex !== null) {
      const updated = [...allChildren];
      updated[selectedChildIndex].groupedFeed = grouped.map(g => ({
        date: g.date,
        totalFeedMinutes: g.totalFeedMinutes,
        records: g.records.map(r => ({
          date: r.date,
          time: r.time,
          state: r.state,
        }))
      }));
      saveAllChildren(updated);
    }
  }, [records]);

  const getLastMode = (): "start" | "stop" | null => {
    if (selectedChild?.currentModeFeed?.mode) {
      return selectedChild.currentModeFeed.mode;
    }
    const last = selectedChild?.breastfeedingRecords?.[selectedChild.breastfeedingRecords.length - 1];
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

        {grouped.map(({ date, totalFeedMinutes, records }, groupIdx) => (
          <GroupSection key={`group-${date}-${groupIdx}`}>
            <View style={styles.row}>
              {isEditMode && (
                <EditPencil
                  targetPath={`/actions/breastfeeding-edit?date=${encodeURIComponent(date)}`}
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
});