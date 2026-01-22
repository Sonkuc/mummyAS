import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import { MyBarChart } from "@/components/MyBarChart";
import * as api from "@/components/storage/api";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function BreastfeedingStats() {
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "halfYear">("week");
  const [stats, setStats] = useState<{ date: string; total_minutes: number }[]>([]);
  const { selectedChildId } = useChild();

  // 1. Načtení předpočítaných dat z backendu
  useEffect(() => {
    if (selectedChildId) {
      api.fetchBreastfeedingStats(selectedChildId)
        .then(setStats)
        .catch(err => console.error("Chyba při načítání statistik:", err));
    }
  }, [selectedChildId]);

  // 2. Zpracování dat pro graf (filtrování a průměrování)
  const chartData = useMemo(() => {
    if (!stats.length) return [];

    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Převedeme na základní formát pro grafy a vynecháme dnešek (neúplná data)
    const baseData = stats
      .filter(s => s.date !== todayStr)
      .map(s => ({
        date: s.date,
        hours: s.total_minutes / 60,
        label: `${s.date.split("-")[2]}/${s.date.split("-")[1]}`, // DD/MM
      }));

    if (periodMode === "week") {
      return baseData.slice(-7);
    }

    if (periodMode === "month") {
      const last30 = baseData.slice(-30);
      const chunks = [];
      for (let i = 0; i < last30.length; i += 5) {
        const chunk = last30.slice(i, i + 5);
        const avg = chunk.reduce((sum, r) => sum + r.hours, 0) / chunk.length;
        chunks.push({ hours: avg, label: chunk[0].label });
      }
      return chunks;
    }

    if (periodMode === "halfYear") {
      const last180 = baseData.slice(-180);
      const months: Record<string, { sum: number; count: number }> = {};
      last180.forEach(d => {
        const key = d.date.slice(0, 7); // YYYY-MM
        if (!months[key]) months[key] = { sum: 0, count: 0 };
        months[key].sum += d.hours;
        months[key].count++;
      });
      return Object.entries(months).map(([key, val]) => ({
        label: `${key.split("-")[1]}/${key.split("-")[0].slice(2)}`,
        hours: val.sum / val.count
      }));
    }

    return baseData;
  }, [stats, periodMode]);

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/breastfeeding" />
      <Title>Statistika kojení</Title>

      {/* Tvoje styly zachovány */}
      <View style={styles.row}>
        {(["week", "month", "halfYear"] as const).map((mode) => (
          <Pressable
            key={mode}
            style={[
              styles.periodButton,
              periodMode === mode && styles.activeButton,
            ]}
            onPress={() => setPeriodMode(mode)}
          >
            <Text style={styles.buttonText}>
              {mode === "week" ? "Týden" : mode === "month" ? "Měsíc" : "Půlrok"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chartContainer}>
        {chartData.length > 0 ? (
          <MyBarChart
            title={
              periodMode === "week"
                ? "Doba kojení denně v posledním týdnu"
                : periodMode === "month"
                ? "Pětidenní průměr doby kojení v posledním měsíci"
                : "Měsíční průměr doby kojení za poslední půlrok"
            }
            data={chartData}
            mode={periodMode}
            dayMode="day"
          />
        ) : (
          <Text style={styles.noData}>Zatím nemáte dostatek dat.</Text>
        )}
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  periodButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  activeButton: {
    backgroundColor: COLORS.secundary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
    justifyContent: "center",
    marginBottom: 15,
  },
  chartContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 10,
  },
  noData: {
    marginTop: 50,
    color: "#999",
    fontStyle: "italic",
  }
});
