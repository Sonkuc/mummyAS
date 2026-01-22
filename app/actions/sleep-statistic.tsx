import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import { MyBarChart } from "@/components/MyBarChart";
import * as api from "@/components/storage/api";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Typ pro data přicházející z backendu
interface SleepStatEntry {
  date: string;
  total_minutes: number;
  night_minutes?: number; // Backend spočítá noční spánek
}

export default function SleepStats() {
  const { selectedChildId } = useChild();
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "halfYear">("week");
  const [dayMode, setDayMode] = useState<"day" | "plusNight">("plusNight");
  const [stats, setStats] = useState<SleepStatEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Načtení dat (identické s kojením)
  useEffect(() => {
    if (selectedChildId) {
      setLoading(true);
      api.fetchSleepStats(selectedChildId)
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

  // 2. Zpracování dat pro graf (Logika agregace převzatá z kojení)
  const chartData = useMemo(() => {
    if (!stats.length) return [];

    // Získáme dnešní datum ve formátu YYYY-MM-DD
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const baseData = stats
      .filter(s => {
        const hours = s.total_minutes / 60;
        // 1. Vyřadíme dnešek
        // 2. Vyřadíme nesmysly (více než 22h)
        // 3. Vyřadíme nulové dny
        return s.date !== todayStr && hours <= 22 && hours > 0;
      })
      .map(s => {
        // Zásadní oprava: Zajistíme, aby night_minutes bylo číslo
        const total = s.total_minutes || 0;
        const night = s.night_minutes || 0;
        
        // Výpočet podle režimu
        const finalMinutes = dayMode === "day" 
          ? Math.max(0, total - night) 
          : total;

        return {
          date: s.date,
          hours: finalMinutes / 60,
          // DD/MM (např. 21/01)
          label: s.date.split("-").reverse().slice(0, 2).join("/"),
        };
      });

    // --- REŽIMY OBDOBÍ ---

    if (periodMode === "week") {
      return baseData.slice(-7);
    }

    if (periodMode === "month") {
      const last30 = baseData.slice(-30);
      const chunks = [];
      for (let i = 0; i < last30.length; i += 5) {
        const chunk = last30.slice(i, i + 5);
        if (chunk.length === 0) continue;
        const avg = chunk.reduce((sum, r) => sum + r.hours, 0) / chunk.length;
        // Formát: od DD/MM
        chunks.push({ 
          hours: avg, 
          label: `od ${chunk[0].label}` 
        });
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
        // Formát: MM/YY
        label: `${key.split("-")[1]}/${key.split("-")[0].slice(2)}`,
        hours: val.sum / val.count
      }));
    }

    return baseData;
  }, [stats, periodMode, dayMode]);

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
          <MyBarChart
            title={
              periodMode === "week"
                ? "Doba spánku denně v posledním týdnu"
                : periodMode === "month"
                ? "Pětidenní průměr doby spánku v posledním měsíci"
                : "Měsíční průměr doby spánku za poslední půlrok"
            }
            data={chartData}
            mode={periodMode}
            dayMode={dayMode}
          />
  
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
});
