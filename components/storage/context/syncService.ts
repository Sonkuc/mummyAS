import { Child } from "@/components/storage/interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const mergeByDate = <T extends { date: string }>(
  apiData: T[], 
  localData: T[], 
  isChildPending: boolean
): T[] => {
  // 1. Seznam všech unikátních dat z obou zdrojů
  const allDates = Array.from(new Set([...apiData.map(d => d.date), ...localData.map(d => d.date)]));

  const merged: T[] = [];

  allDates.forEach(date => {
    const apiDay = apiData.filter(r => r.date === date);
    const localDay = localData.filter(r => r.date === date);

    if (isChildPending) {
      // Pokud v lokálních datech tento den existoval (i prázdné), věříme lokální verzi.
      const dayWasTouchedLocally = localData.some(r => r.date === date) || 
        (localDay.length === 0 && apiDay.length > 0 && isChildPending);
      
      if (dayWasTouchedLocally) {
        merged.push(...localDay);
      } else {
        merged.push(...apiDay);
      }
    } else {
      // Pokud nejsme v pending stavu, standardně upřednostníme API, 
      if (apiDay.length > 0) {
        merged.push(...apiDay);
      } else {
        merged.push(...localDay);
      }
    }
  });

  return merged;
};

// Pomocník pro "per-day" synchronizaci (Spánek, Kojení)
export const syncDailyRecords = async (
  childId: string, 
  localRecords: { date: string }[] | undefined, 
  apiFunc: (id: string, date: string, data: any[]) => Promise<any>,
  fetchApiFunc: (id: string) => Promise<any[]> // Přidáme funkci pro načtení aktuálního stavu ze serveru
) => {
  // 1. Získáme data, která jsou aktuálně na serveru
  const currentApiData = await fetchApiFunc(childId).catch(() => []);
  
  // 2. Unikátní data (lokální i serverová)
  const uniqueDates = new Set([
    ...(localRecords?.map(r => r.date) || []),
    ...currentApiData.map(r => r.date)
  ]);

  if (uniqueDates.size === 0) return;

  for (const date of uniqueDates) {
    const dayRecords = (localRecords || []).filter(r => r.date === date);
    
    // Zda se data liší 
    const apiDayRecords = currentApiData.filter(r => r.date === date);
    
    // Jednoduché porovnání délky nebo obsahu stačí pro vyvolání syncu (lokal vs. server)
    if (JSON.stringify(dayRecords) !== JSON.stringify(apiDayRecords)) {
        await apiFunc(childId, date, dayRecords);
    }
  }
};

export const safeParse = (data: string | null, fallback: any) => {
  try { return data ? JSON.parse(data) : fallback; } 
  catch { return fallback; }
};

export const processDeletionQueue = async (key: string, deleteFn: (item: any) => Promise<any>) => {
  const data = await AsyncStorage.getItem(key);
  if (!data) return;
  const items = JSON.parse(data);
  const remaining = [];
  for (const item of items) {
    try {
      // Pokud objekt (milestone/word), posíláme childId a id, pokud string (child), posíláme id
      await deleteFn(item);
    } catch (err: any) {
      if (!err.message.includes("404")) remaining.push(item);
    }
  }
  await AsyncStorage.setItem(key, JSON.stringify(remaining));
};

export const removeFromPendingUpdates = async (
  childId: string, 
  field: keyof Child, 
  recordId: string, 
  idField: string = 'id'
) => {
  const pendingStr = await AsyncStorage.getItem("pending_child_updates");
  if (!pendingStr) return;
  
  const pending = JSON.parse(pendingStr);
  if (pending[childId] && Array.isArray(pending[childId][field])) {
    // filtrujeme z pole konkrétní záznam (milník, slovo, jídlo...)
    pending[childId][field] = (pending[childId][field] as any[]).filter(
      r => r[idField]?.toString() !== recordId.toString()
    );
    await AsyncStorage.setItem("pending_child_updates", JSON.stringify(pending));
  }
};