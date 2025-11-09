export const clearStateGeneric = (
  type: "sleep" | "feed",
  setMode: (m: any) => void,
  setMinutesSinceStart: (v: any) => void,
  setMinutesSinceStop: (v: any) => void,
  setModeStart: (v: any) => void,
  selectedChildIndex: number | null,
  allChildren: any[],
  saveAllChildren: (ch: any) => void
) => {
  setMode("");
  setMinutesSinceStart(null);
  setMinutesSinceStop(null);
  setModeStart(null);

  if (selectedChildIndex !== null) {
    const updated = [...allChildren];
    if (type === "sleep") updated[selectedChildIndex].currentModeSleep = null;
    if (type === "feed") updated[selectedChildIndex].currentModeFeed = null;
    saveAllChildren(updated);
  }
};

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

export const getLastModeGeneric = (
  type: "sleep" | "feed",
  selectedChild: any
): string | null => {
  if (!selectedChild) return null;

  if (type === "sleep") {
    if (selectedChild?.currentModeSleep?.mode) return selectedChild.currentModeSleep.mode;
    const last = selectedChild?.sleepRecords?.[selectedChild.sleepRecords.length - 1];
    return last?.state ?? null;
  }

  if (type === "feed") {
    if (selectedChild?.currentModeFeed?.mode) return selectedChild.currentModeFeed.mode;
    const last = selectedChild?.breastfeedingRecords?.[selectedChild.breastfeedingRecords.length - 1];
    return last?.state ?? null;
  }

  return null;
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