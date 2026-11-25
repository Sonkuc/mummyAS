import { Child } from "@/components/storage/interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  if (records === undefined) return;

  const grouped: Record<string, any[]> = {};

  if (records && records.length > 0) {
    records.forEach((rec) => {
      if (!grouped[rec.date]) grouped[rec.date] = [];
      const { child_id, ...rest } = rec;
      grouped[rec.date].push(rest);
    });
  }

  if (records.length === 0) {
    // Pokud potřebujeme smazat dnešek při kompletním vyčištění:
    const today = new Date().toISOString().slice(0, 10);
    grouped[today] = [];
  }
  
  for (const [date, data] of Object.entries(grouped)) {
    try {
      await syncFunction(childId, date, data, userId);
    } catch (err) {
      console.warn(`[SYNC] Failed for date ${date}`, err);
    }
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