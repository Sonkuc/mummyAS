import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import { MyBarChart } from "@/components/MyBarChart";
import { useChartData } from "@/components/statisticBfSleep";
import * as api from "@/components/storage/api";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/contexts/ChildContext";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function BreastfeedingStats() {
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "halfYear">("week");
  const [stats, setStats] = useState<{ date: string; total_minutes: number }[]>([]);
  const { selectedChildId } = useChild();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (selectedChildId) {
      setLoading(true);
      api.fetchBreastfeedingStats(selectedChildId, user!.id)
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

  const chartData = useChartData(stats, periodMode, "day");

  const getChartTitle = () => {
    switch (periodMode) {
      case "week": return "Doba kojení denně v posledním týdnu";
      case "month": return "Pětidenní průměr doby kojení v posledním měsíci";
      case "halfYear": return "Měsíční průměr doby kojení za poslední půlrok";
      default: return "";
    }
  };

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
            title={getChartTitle()}
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
