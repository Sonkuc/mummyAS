import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import { MyBarChart } from "@/components/MyBarChart";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SleepStats() {
  const { selectedChild } = useChild();
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "halfYear"> ("week");
  const grouped = selectedChild?.groupedSleep ?? [];
  const [dayMode, setDayMode] = useState <"day" | "plusNight"> ("plusNight")

  const dailyData = useMemo(() => {
    if (!grouped.length) return [];

    const today = new Date();
    const sorted = [...grouped]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => {
        const totalMinutes =
          dayMode === "day" && r.nightSleepMinutes
            ? r.totalSleepMinutes - r.nightSleepMinutes
            : r.totalSleepMinutes;

        return {
          date: r.date,
          hours: totalMinutes / 60,
          label: `${r.date.split("-")[2]}/${r.date.split("-")[1]}`, // DD/MM
          hasDaySleep: r.nightSleepMinutes !== undefined,
          finishedDay: r.totalSleepMinutes / 60 <= 24,
        };
      })
      .filter((r) => {
        const [y, m, d] = r.date.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        return !(
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()
        );
      })
      .filter((r) => r.finishedDay && r.hasDaySleep);

    if (periodMode === "week") {
      return sorted.slice(-7);
    }

    if (periodMode === "month") {
      const last30 = sorted.slice(-30);
      const groups: { hours: number; label: string }[] = [];

      for (let i = 0; i < last30.length; i += 5) {
        const chunk = last30.slice(i, i + 5);
        const avg = chunk.reduce((sum, r) => sum + r.hours, 0) / chunk.length;
        const [y, m, d] = chunk[0].date.split("-");
        groups.push({ hours: avg, label: `od ${d}/${m}` });
      }

      return groups;
    }

    if (periodMode === "halfYear") {
      const last180 = sorted.slice(-180);
      const monthMap: Record<string, { sum: number; count: number }> = {};

      last180.forEach(({ date, hours }) => {
        const [y, m] = date.split("-");
        const key = `${m}/${y}`;
        if (!monthMap[key]) monthMap[key] = { sum: 0, count: 0 };
        monthMap[key].sum += hours;
        monthMap[key].count++;
      });

      return Object.entries(monthMap).map(([label, { sum, count }]) => ({
        label,
        hours: sum / count,
      }));
    }

    return sorted;
  }, [grouped, periodMode, dayMode]);
    
  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep" />
      <Title>Statistika</Title>

      <View style={styles.row}>
        {(["week", "month", "halfYear"] as const).map((mode) => (
          <Pressable
            key={mode}
            style={[styles.periodButton, periodMode === mode && styles.activeButton]}
            onPress={() => setPeriodMode(mode)}
          >
            <Text style={styles.buttonText}>
              {mode === "week" ? "Týden" : mode === "month" ? "Měsíc" : "Půlrok"}
            </Text>
          </Pressable>
        ))}
      </View>

      <MyBarChart
        title={
          periodMode === "week"
            ? "Doba spánku denně za poslední týden"
            : periodMode === "month"
            ? "Průměrná doba spánku za 5 dní v posledním měsíci"
            : "Měsíční průměr doby spánku za poslední půlrok"
        }
        data={dailyData}
        mode={periodMode}
        dayMode={dayMode}
      />

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
    justifyContent: "space-evenly",
    marginBottom: 15,
  },
});
