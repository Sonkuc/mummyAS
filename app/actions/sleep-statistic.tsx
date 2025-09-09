import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import { MyBarChart } from "@/components/MyBarChart";
import type { GroupedRecord } from "@/components/storage/SaveChildren";
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

export default function SleepStats() {
  const { selectedChild } = useChild();
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "halfYear" > ("week");
  const grouped = selectedChild?.groupedSleep ?? [];
  const [dayMode, setDayMode] = useState <"day" | "plusNight"> ("plusNight")

  const computeDailyStatsFromGrouped = (records: GroupedRecord[], dayMode: "day" | "plusNight") =>
    records.map(r => {
      const totalMinutes =
        dayMode === "day" && r.nightSleepMinutes
          ? r.totalSleepMinutes - r.nightSleepMinutes
          : r.totalSleepMinutes;

      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;

      return {
        date: r.date,
        hours: totalMinutes / 60, // čistá hodnota v hodinách
        label: `${h} h ${m} m`,
      };
    });

    const dailyData = useMemo(() => {
      if (grouped.length === 0) return [];

      const sorted = [...grouped].sort((a, b) => a.date.localeCompare(b.date));

      const stats = computeDailyStatsFromGrouped(sorted, dayMode);

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
  }, [grouped, periodMode, dayMode]);
  
  return (
    <MainScreenContainer>
    <CustomHeader backTargetPath="/actions/sleep" />
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
        title="Doba spánku denně za poslední týden"
        data={dailyData}
        mode="week"
      />
    )}
    {periodMode === "month" && (
      <MyBarChart
        title="Průměrná doba spánku za 5 dní v posledním měsíci"
        data={dailyData}
        mode="month"
      />
    )}
    {periodMode === "halfYear" && (
      <MyBarChart
        title="Měsíční průměr doby spánku za poslední půlrok"
        data={dailyData}
        mode="halfYear"
      />
    )}

    <Pressable 
      style={[styles.periodButton, { marginTop: 30 }]}
      onPress={() => setDayMode(dayMode === "plusNight" ? "day" : "plusNight")}
    >
      <Text style={styles.buttonText}>
        {dayMode === "plusNight" ? "Bez nočního spánku" : "Včetně nočního spánku"}
      </Text>
    </Pressable>

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
