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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedChildId) {
      setLoading(true);
      api.fetchBreastfeedingStats(selectedChildId)
        .then((data) => {
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Chyba při načítání statistik kojení:", err);
          setLoading(false);
        });
    }
  }, [selectedChildId]);

  const chartData = useMemo(() => {
    if (stats.length === 0) return [];

    // 1. Seřazení od nejstaršího po nejnovější
    let allData = [...stats].sort((a, b) => a.date.localeCompare(b.date));

    const baseData = allData
      .map(s => {
        // FORMÁT DATA: DD/MM
        const [year, month, day] = s.date.split("-");
        const formattedLabel = `${day}/${month}`;

        return {
          date: s.date,
          hours: s.total_minutes / 60,
          label: formattedLabel,
        };
      });

    // 3. OTOČENÍ: Pro výběr období slice-ujeme od nejnovějších
    const reversedData = baseData.reverse();

    if (periodMode === "week") {
      return reversedData.slice(0, 7);
    }

    if (periodMode === "month") {
      const last30 = reversedData.slice(0, 30);
      const chunks = [];
      for (let i = 0; i < last30.length; i += 5) {
        const chunk = last30.slice(i, i + 5);
        if (chunk.length === 0) continue;
        const avg = chunk.reduce((sum, r) => sum + r.hours, 0) / chunk.length;
        chunks.push({ 
          hours: avg, 
          label: chunk.length > 1 
            ? `${chunk[chunk.length - 1].label}-${chunk[0].label}` 
            : chunk[0].label 
        });
      }
      return chunks;
    }

    if (periodMode === "halfYear") {
      const last180 = reversedData.slice(0, 180);
      const months: Record<string, { sum: number; count: number }> = {};
      
      last180.forEach(d => {
        const key = d.date.slice(0, 7);
        if (!months[key]) months[key] = { sum: 0, count: 0 };
        months[key].sum += d.hours;
        months[key].count++;
      });

      return Object.entries(months)
        .map(([key, val]) => {
          const [year, month] = key.split("-");
          return {
            label: `${month}/${year.slice(2)}`,
            hours: val.sum / val.count,
            key: key
          };
        })
        .sort((a, b) => b.key.localeCompare(a.key));
    }

    return reversedData;
  }, [stats, periodMode]);

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/breastfeeding" />
      <Title>Statistika kojení</Title>

      <View style={styles.row}>
        {(["week", "month", "halfYear"] as const).map((m) => (
          <Pressable
            key={m}
            style={[styles.periodButton, periodMode === m && styles.activeButton]}
            onPress={() => setPeriodMode(m)}
          >
            <Text style={styles.buttonText}>
              {m === "week" ? "Týden" : m === "month" ? "Měsíc" : "Půlrok"}
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
          <Text style={styles.noData}>
            {loading ? "Načítám data..." : "Zatím nemáte dostatek dat."}
          </Text>
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
