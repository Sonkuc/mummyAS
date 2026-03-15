import { useMemo } from "react";

export type PeriodMode = "week" | "month" | "halfYear";

interface RawStat {
  date: string;
  total_minutes: number;
  night_minutes?: number;
}

export function useChartData(
  stats: RawStat[], 
  periodMode: PeriodMode, 
  dayMode: "day" | "plusNight" = "day"
) {
  return useMemo(() => {
    if (stats.length === 0) return [];

    // 1. Seřazení podle data
    const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date));

    // 2. Filtrace: dnešek a záznamy nad 22 hodin
    const todayStr = new Date().toISOString().split('T')[0];
    
    const filtered = sorted.filter(s => {
      const totalH = s.total_minutes / 60;
      const isToday = s.date === todayStr;
      const isInvalid = totalH <= 0 || totalH > 22;
      return !isToday && !isInvalid;
    });

    if (filtered.length === 0) return [];

    // 3. Mapování na základní hodiny (příprava pro agregaci)
    const baseMapped = filtered.map(s => {
      const total = s.total_minutes || 0;
      const night = s.night_minutes || 0;
      const finalMinutes = dayMode === "day" ? Math.max(0, total - night) : total;
      
      return {
        date: s.date,
        hours: finalMinutes / 60,
      };
    });

    // 4. Agregace podle PeriodMode
    if (periodMode === "week") {
      return baseMapped.slice(-7).map(d => ({
        hours: d.hours,
        label: `${d.date.split("-")[2]}/${d.date.split("-")[1]}`, // DD/MM
      }));
    }

    if (periodMode === "month") {
      const last30 = baseMapped.slice(-30);
      const chunks = [];
      for (let i = 0; i < last30.length; i += 5) {
        const chunk = last30.slice(i, i + 5);
        if (chunk.length === 0) continue;
        const avg = chunk.reduce((sum, d) => sum + d.hours, 0) / chunk.length;
        const [y, m, dd] = chunk[0].date.split("-");
        chunks.push({
          hours: avg,
          label: `od ${dd}/${m}`, 
        });
      }
      return chunks;
    }

    if (periodMode === "halfYear") {
      const last180 = baseMapped.slice(-180);
      const monthMap: Record<string, { sum: number; count: number }> = {};
      
      last180.forEach(d => {
        const [y, m] = d.date.split("-");
        const key = `${m}/${y}`;
        if (!monthMap[key]) monthMap[key] = { sum: 0, count: 0 };
        monthMap[key].sum += d.hours;
        monthMap[key].count += 1;
      });

      return Object.entries(monthMap).map(([label, val]) => ({
        hours: val.sum / val.count,
        label,
      }));
    }

    return [];
  }, [stats, periodMode, dayMode]);
}