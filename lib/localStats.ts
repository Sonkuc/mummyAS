import { BreastfeedingRecord, SleepRecord } from "@/components/storage/interfaces";

/**
 * Výpočet statistik přímo v aplikaci (používá se ve zkušebním režimu, kdy se
 * nevolá backend). Logika odpovídá endpointům /sleep/stats a /breastfeeding/stats.
 */

const toMinutes = (date: string, time: string) => {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  // UTC jen jako „kalendářní“ čas – rozdíly pak nezávisí na letním čase
  return Date.UTC(y, mo - 1, d, h, mi) / 60000;
};

export function computeSleepStats(records: SleepRecord[]) {
  if (!records.length) return [];
  const sorted = [...records].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const days: Record<string, SleepRecord[]> = {};
  for (const r of sorted) (days[r.date] ||= []).push(r);
  const dates = Object.keys(days).sort();
  const result: Record<string, { total_minutes: number; night_minutes: number }> = {};
  dates.forEach(d => (result[d] = { total_minutes: 0, night_minutes: 0 }));

  // Denní spánky
  for (const d of dates) {
    const recs = days[d];
    for (let i = 0; i < recs.length - 1; i++) {
      if (recs[i].state !== "sleep") continue;
      const diff = toMinutes(recs[i + 1].date, recs[i + 1].time) - toMinutes(recs[i].date, recs[i].time);
      if (diff > 0 && diff < 960) result[d].total_minutes += diff;
    }
  }

  // Noční spánek (poslední usnutí dne -> první probuzení dalšího dne)
  for (let i = 0; i < dates.length - 1; i++) {
    const lastSleep = [...days[dates[i]]].reverse().find(r => r.state === "sleep");
    const firstAwake = days[dates[i + 1]].find(r => r.state === "awake");
    if (lastSleep && firstAwake) {
      const diff = toMinutes(firstAwake.date, firstAwake.time) - toMinutes(lastSleep.date, lastSleep.time);
      if (diff > 0) {
        result[dates[i]].total_minutes += diff;
        result[dates[i]].night_minutes = diff;
      }
    }
  }

  return dates.map(date => ({ date, ...result[date] }));
}

export function computeBreastfeedingStats(records: BreastfeedingRecord[]) {
  const sorted = [...records].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const stats: Record<string, number> = {};
  let activeStart: BreastfeedingRecord | null = null;

  for (const rec of sorted) {
    if (!(rec.date in stats)) stats[rec.date] = 0;
    if (rec.state === "start") {
      activeStart = rec;
    } else if (rec.state === "stop" && activeStart) {
      const diff = toMinutes(rec.date, rec.time) - toMinutes(activeStart.date, activeStart.time);
      if (diff > 0 && diff < 120) stats[activeStart.date] = (stats[activeStart.date] || 0) + diff;
      activeStart = null;
    }
  }

  return Object.keys(stats).sort().map(date => ({ date, total_minutes: stats[date] }));
}
