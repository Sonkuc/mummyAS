import { Child } from "@/components/storage/interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export const syncSectionByDate = async (
  childId: string,
  userId: string,
  records: any[] | undefined,
  syncFunction: (childId: string, date: string, data: any, userId: string) => Promise<any>
) => {
  if (!records || records.length === 0) return;

  const grouped = records.reduce((acc, rec) => {
    if (!acc[rec.date]) acc[rec.date] = [];
    const { child_id, ...rest } = rec; // Očištění dat
    acc[rec.date].push(rest);
    return acc;
  }, {} as Record<string, any[]>);

  for (const [date, data] of Object.entries(grouped)) {
    try {
      await syncFunction(childId, date, data, userId);
    } catch (err) {
      console.warn(`[SYNC] Failed for date ${date}`, err);
    }
  }
};

export const syncGenericSection = async (
  label: string,
  syncPromise: Promise<any>
) => {
  try {
    await syncPromise;
    console.log(`[SYNC] ${label} success.`);
  } catch (err) {
    console.warn(`[SYNC] ${label} failed.`, err);
  }
};

export const addToPendingUpdates = async (childId: string, data: any) => {
  const pending = safeParse(await AsyncStorage.getItem("pending_child_updates"), {});
  pending[childId] = data;
  await AsyncStorage.setItem("pending_child_updates", JSON.stringify(pending));
};

/**
 * Setter pro AsyncStorage s podporou null (odstranění).
 */
export const setStoredSelectedChildId = async (id: string | null) => {
  if (id) {
    await AsyncStorage.setItem("selectedChildId", id);
  } else {
    await AsyncStorage.removeItem("selectedChildId");
  }
};

/**
 * Zpracuje chybu API uložením aktuálního stavu dítěte do pending fronty.
 */
export const handleSyncError = async (childId: string, updatedList: Child[]) => {
  const currentChild = updatedList.find(c => c.id === childId);
  if (currentChild) {
    await addToPendingUpdates(childId, currentChild);
  }
};

/**
 * Helper pro přidání záznamu do smazané fronty (pro různé klíče).
 */
export const addToDeletionQueue = async (key: string, item: any) => {
  const existing = await AsyncStorage.getItem(key);
  const list = existing ? JSON.parse(existing) : [];
  list.push(item);
  await AsyncStorage.setItem(key, JSON.stringify(list));
};