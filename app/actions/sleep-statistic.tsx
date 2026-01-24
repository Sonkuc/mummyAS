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
  night_minutes: number; // Backend spočítá noční spánek
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
    if (stats.length === 0) return [];

    // 1. Seřazení od nejstaršího po nejnovější
    let allData = [...stats].sort((a, b) => a.date.localeCompare(b.date));

    // 2. OŘEZÁNÍ: Odstraníme první a úplně poslední záznam (neuzavřené dny)
    // slice(1, -1) vezme vše od indexu 1 až po předposlední prvek
    if (allData.length < 3) return []; // Potřebujeme aspoň 3 dny, aby po ořezu něco zbylo
    let processed = allData.slice(1, -1);

    const baseData = processed
      .filter(s => {
        const totalHours = s.total_minutes / 60;
        const nightHours = (s.night_minutes || 0) / 60;
        const dayHours = totalHours - nightHours;

        // TVOJE FILTRY:
        const isTooLongTotal = totalHours > 23;
        const isTooLongDay = dayHours > 17;
        const isEmpty = totalHours <= 0;

        const isInvalid = isTooLongTotal || isTooLongDay || isEmpty;
        
        return !isInvalid;
      })
      .map(s => {
        const total = s.total_minutes || 0;
        const night = s.night_minutes || 0;
        const dayMinutes = total - night;

        const finalMinutes = dayMode === "day" ? Math.max(0, dayMinutes) : total;

        // FORMÁT DATA: Z "YYYY-MM-DD" uděláme "DD/MM"
        const [year, month, day] = s.date.split("-");
        const formattedLabel = `${day}/${month}`;

        return {
          date: s.date,
          hours: finalMinutes / 60,
          label: formattedLabel, // Nový formát DD/MM
        };
      });

    // 3. OTOČENÍ: Pro grafy obvykle chceme nejnovější data vpravo, 
    // ale pokud tvůj graf vykresluje zleva, ponech baseData.reverse()
    const reversedData = baseData.reverse();
    
    // 4. VÝBĚR OBDOBÍ
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
          // Lepší label pro pětidenní průměr: zobrazí rozsah "Od-Do"
          label: chunk.length > 1 
            ? `${chunk[chunk.length-1].label}-${chunk[0].label}`
            : chunk[0].label
        });
      }
      return chunks;
    }

    if (periodMode === "halfYear") {
      const last180 = reversedData.slice(0, 180);
      const months: Record<string, { sum: number; count: number }> = {};
      
      last180.forEach(d => {
        const key = d.date.slice(0, 7); // YYYY-MM
        if (!months[key]) months[key] = { sum: 0, count: 0 };
        months[key].sum += d.hours;
        months[key].count++;
      });

      return Object.entries(months)
        .map(([key, val]) => {
          const [year, month] = key.split("-");
          return {
            label: `${month}/${year.slice(2)}`, // MM/YY
            hours: val.sum / val.count,
            key: key
          };
        })
        .sort((a, b) => b.key.localeCompare(a.key));
    }

    return reversedData;
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
