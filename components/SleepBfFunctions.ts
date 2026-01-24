export const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} h ${m} min`;
    return `${m} min`;
  };

export const toTimestamp = (dateStr: string, timeStr: string) => {
    let year = 0, month = 0, day = 0;
    if (dateStr.includes("-")) {
      [year, month, day] = dateStr.split("-").map((s) => parseInt(s, 10));
    } else if (dateStr.includes(".")) {
      [day, month, year] = dateStr.split(".").map((s) => parseInt(s, 10));
    }
    const [hh, mm] = timeStr.split(":").map((s) => parseInt(s, 10));
    return new Date(year, month - 1, day, hh, mm).getTime();
  };

// povolit jen čísla a 1 dvojtečku, max délka 5
export const handleTimeInput = (txt: string, set: (v: string) => void) => {
  let t = txt.replace(/[^\d:]/g, ""); // jen čísla a :
  // odstraníme případné další dvojtečky
  const firstColon = t.indexOf(":");
  if (firstColon !== -1) {
    t = t.slice(0, firstColon + 1) + t.slice(firstColon + 1).replace(/:/g, "");
  }
  // omezíme délku
  if (t.length > 5) t = t.slice(0, 5);
  set(t);
};

// vrátí validní HH:MM nebo null
export const normalizeTime = (input: string): string | null => {
  if (!input) return null;
  const m = input.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
};