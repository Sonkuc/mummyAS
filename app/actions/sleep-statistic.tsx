import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Pomocná funkce na timestamp
const toTimestamp = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
};

// Funkce na seskupení do dnů a spočítání spánku
const computeDailyStats = (records: { date: string; time: string; state: "sleep" | "awake" }[]) => {
  const grouped: Record<string, number> = {};

  for (let i = 0; i < records.length - 1; i++) {
    const curr = records[i];
    const next = records[i + 1];
    const t1 = toTimestamp(curr.date, curr.time);
    const t2 = toTimestamp(next.date, next.time);

    if (curr.state === "sleep" && t2 > t1) {
      const minutes = (t2 - t1) / 60000;
      grouped[curr.date] = (grouped[curr.date] || 0) + minutes;
    }
  }

  return Object.entries(grouped).map(([date, minutes]) => ({
    date,
    hours: +(minutes / 60).toFixed(1),
  }));
};

export default function SleepStats() {
  const { selectedChild } = useChild();
  const router = useRouter();

  const dailyData = useMemo(() => {
    if (!selectedChild?.sleepRecords) return [];
    return computeDailyStats(selectedChild.sleepRecords);
  }, [selectedChild]);

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions" />
      <Title>Statistika</Title>
      <View style={styles.row}>
        <Pressable style={styles.periodButton} >
          <Text style={styles.buttonText}> Týden </Text>
        </Pressable>
        <Pressable style={styles.periodButton} >
          <Text style={styles.buttonText}> Měsíc </Text>
        </Pressable>
        <Pressable style={styles.periodButton} >
          <Text style={styles.buttonText}> Půlrok </Text>
        </Pressable>
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  periodButton: {
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
    gap: 25,
    justifyContent: "center"
  },
});
