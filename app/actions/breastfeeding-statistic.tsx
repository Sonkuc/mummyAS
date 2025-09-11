import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import { MyBarChart } from "@/components/MyBarChart";
import type { GroupedBreastfeedingRecord } from "@/components/storage/SaveChildren";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const formatDateToCzech = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-");
      return `${day}.${month}.`;
    }
    return dateStr;
  };

export default function BreastfeedingStats() {
  const { selectedChild } = useChild();
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "halfYear" > ("week");
  const grouped = selectedChild?.groupedFeed ?? [];

  const computeDailyStatsFromGrouped = (records: GroupedBreastfeedingRecord[]) =>
    records.map(r => {
      const h = Math.floor(r.totalFeedMinutes / 60);
      const m = r.totalFeedMinutes % 60;

      return {
        date: r.date,
        hours: r.totalFeedMinutes / 60, // čistá hodnota v hodinách
        label: `${h} h ${m} m`,
      };
    });

    const dailyData = useMemo(() => {
      if (grouped.length === 0) return [];

      const sorted = [...grouped].sort((a, b) => a.date.localeCompare(b.date));

      const stats = computeDailyStatsFromGrouped(sorted);

      // vyhodíme dnešní datum
      const today = new Date();
      const filtered = stats.filter((d) => {
        const [y, m, dd] = d.date.split("-").map(Number);
        const dDate = new Date(y, m - 1, dd);
        return !(
          dDate.getFullYear() === today.getFullYear() &&
          dDate.getMonth() === today.getMonth() &&
          dDate.getDate() === today.getDate()
        );
      });

      if (periodMode === "week") {
        return filtered.slice(-7); 
      }

      if (periodMode === "month") {
        const last30 = filtered.slice(-30); 
        const groups: { date: string; hours: number; from: string }[] = [];
        for (let i = 0; i < last30.length; i += 5) {
          const chunk = last30.slice(i, i + 5);
          if (chunk.length > 0) {
            const avg = chunk.reduce((sum, d) => sum + d.hours, 0) / chunk.length;
            groups.push({
              date: chunk[0].date,
              from: formatDateToCzech(chunk[0].date),
              hours: avg,
            });
          }
        }
        return groups;
      }

      if (periodMode === "halfYear") {
        const last180 = filtered.slice(-180);
        const monthMap: Record<string, { sum: number; count: number }> = {};
        last180.forEach((d) => {
          const [y, m] = d.date.split("-");
          const key = `${y}-${m}`;
          if (!monthMap[key]) {
            monthMap[key] = { sum: 0, count: 0 };
          }
          monthMap[key].sum += d.hours;
          monthMap[key].count += 1;
        });
        return Object.entries(monthMap).map(([key, val]) => ({
          date: key,
          hours: val.sum / val.count,
        }));
      }

      return filtered;
  }, [grouped, periodMode]);
  
  return (
    <MainScreenContainer>
    <CustomHeader backTargetPath="/actions/breastfeeding" />
    <Title>Statistika</Title>

    <View style={styles.row}>
      <Pressable 
        style={[styles.periodButton, periodMode === "week" && styles.activeButton]}
        onPress={() => setPeriodMode("week")}
      >
        <Text style={styles.buttonText}>Týden</Text>
      </Pressable>
      <Pressable 
        style={[styles.periodButton, periodMode === "month" && styles.activeButton]}
        onPress={() => setPeriodMode("month")}
      >
        <Text style={styles.buttonText}>Měsíc</Text>
      </Pressable>
      <Pressable 
        style={[styles.periodButton, periodMode === "halfYear" && styles.activeButton]}
        onPress={() => setPeriodMode("halfYear")}
      >
        <Text style={styles.buttonText}>Půlrok</Text>
      </Pressable>
    </View>

    {periodMode === "week" && (
      <MyBarChart
        title="Doba kojení denně za poslední týden"
        data={dailyData}
        mode="week"
      />
    )}
    {periodMode === "month" && (
      <MyBarChart
        title="Průměrná doba kojení za 5 dní v posledním měsíci"
        data={dailyData}
        mode="month"
      />
    )}
    {periodMode === "halfYear" && (
      <MyBarChart
        title="Měsíční průměr doby kojení za poslední půlrok"
        data={dailyData}
        mode="halfYear"
      />
    )}
  </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  periodButton: {
    backgroundColor: "#993769",
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  activeButton: {
    backgroundColor: "#cc5588",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
    justifyContent: "center",
    marginBottom: 15,
  },
});
