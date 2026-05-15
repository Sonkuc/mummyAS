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

// Typ pro data přicházející z backendu
interface SleepStatEntry {
  date: string;
  total_minutes: number;
  night_minutes?: number;
}

export default function SleepStats() {
  const { selectedChildId } = useChild();
  const { user } = useAuth();
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "halfYear">("week");
  const [dayMode, setDayMode] = useState<"day" | "plusNight">("plusNight");
  const [stats, setStats] = useState<SleepStatEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Načtení dat 
  useEffect(() => {
    if (selectedChildId) {
      setLoading(true);
      api.fetchSleepStats(selectedChildId, user!.id)
        .then((data) => {
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Chyba při načítání statistik spánku:", err);
          setLoading(false);
        });
    }
  }, [selectedChildId]);

  // 2. Zpracování dat pro graf
  const chartData = useChartData(stats, periodMode, dayMode);

  const getChartTitle = () => {
    const prefix = 
      periodMode === "week" ? "Doba spánku denně v posledním týdnu" : 
      periodMode === "month" ? "Pětidenní průměr doby spánku v posledním měsíci" : 
      "Měsíční průměr doby spánku za poslední půlrok";
    return `${prefix}`;
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep" />
      <Title>Statistika spánku</Title>

      {/* 1. Přepínač období (Week/Month/HalfYear) */}
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

      {/* 2. Graf */}
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
      
      {/* 3. Speciální přepínač pro Spánek (Denní/Celkový) */}
      <Pressable 
        style={[styles.periodButton, { marginTop: 30 }]}
        onPress={() => setDayMode(dayMode === "plusNight" ? "day" : "plusNight")}
      >
        <Text style={styles.buttonText}>
          {dayMode === "plusNight" ? "Zobrazit jen denní spánek" : "Zobrazit včetně nočního spánku"}
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
  noData: {
    marginTop: 50,
    color: "#999",
    fontStyle: "italic",
  }
});
