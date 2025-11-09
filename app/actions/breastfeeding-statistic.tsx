import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import { MyBarChart } from "@/components/MyBarChart";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function BreastfeedingStats() {
  const { selectedChild } = useChild();
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "halfYear">("week");
  const grouped = selectedChild?.groupedFeed ?? [];

  const dailyData = useMemo(() => {
    if (!grouped.length) return [];

    const today = new Date();
    const sorted = [...grouped]
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((r) => {
        const [y, m, d] = r.date.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        return (
          !(date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate())
        );
      })
      .map((r) => ({
        date: r.date,
        hours: r.totalFeedMinutes / 60,
        label: `${r.date.split("-")[2]}/${r.date.split("-")[1]}`, // DD/MM
      }))
      .filter((r) => r.hours <= 24);

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
  }, [grouped, periodMode]);

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/breastfeeding" />
      <Title>Statistika</Title>

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
              {mode === "week"
                ? "Týden"
                : mode === "month"
                ? "Měsíc"
                : "Půlrok"}
            </Text>
          </Pressable>
        ))}
      </View>

      <MyBarChart
        title={
          periodMode === "week"
            ? "Doba kojení denně za poslední týden"
            : periodMode === "month"
            ? "Průměrná doba kojení za 5 dní v posledním měsíci"
            : "Měsíční průměr doby kojení za poslední půlrok"
        }
        data={dailyData}
        mode={periodMode}
        dayMode="day"
      />
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
});
