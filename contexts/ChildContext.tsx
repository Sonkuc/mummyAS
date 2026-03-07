import * as api from "@/components/storage/api";
import { Child, FoodDates } from "@/components/storage/interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ChildContextType = {
  selectedChild: Child | null;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => Promise<void>;
  allChildren: Child[];
  updateChild: (child: Child) => Promise<void>;
  reloadChildren: () => Promise<void>;
  // saveAllChildren pro masivní operace, ale většinou netřeba
  saveAllChildren: (children: Child[]) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  deleteWeightHeightRecord: (childId: string, whId: string) => Promise<void>;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

const mergeByDate = <T extends { date: string }>(
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
const syncDailyRecords = async (
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

const safeParse = (data: string | null, fallback: any) => {
  try { return data ? JSON.parse(data) : fallback; } 
  catch { return fallback; }
};

const processDeletionQueue = async (key: string, deleteFn: (item: any) => Promise<any>) => {
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

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const syncInProgress = useRef(false);
  
  const selectedChild = useMemo(() => {
    return allChildren.find(c => c.id === selectedChildId) || null;
  }, [allChildren, selectedChildId]);

  const syncOfflineData = useCallback(async () => {
    if (syncInProgress.current) return [];
    syncInProgress.current = true;

    try {
      const offlineData = await AsyncStorage.getItem("pending_child_updates");
      if (!offlineData) return [];

      const pendingUpdates: Record<string, Child> = JSON.parse(offlineData);
      const syncedIds: string[] = [];

      // Všechny děti, co čekají na sync
      for (const [originalId, childData] of Object.entries(pendingUpdates)) {
        let currentId = originalId;

        try {
          // --- KROK 0: ZAJIŠTĚNÍ EXISTENCE ---
          await api.updateChild(currentId, childData);

          // --- KROK 1 & 2: DENNÍ ZÁZNAMY ---
          await syncDailyRecords(
            currentId, 
            childData.sleepRecords, 
            api.updateSleepDay, 
            api.fetchSleepRecords
          );
          await syncDailyRecords(
            currentId, 
            childData.breastfeedingRecords, 
            api.updateBreastfeedingDay, 
            api.fetchBreastfeedingRecords
          );

          // --- KROK 3: MILNÍKY ---
          if (childData.milestones) {
            childData.milestones = await api.syncMilestones(currentId, childData.milestones);
          }

          // --- KROK 4: JÍDLO ---
          if (childData.foodDates) {
            await Promise.all(Object.keys(childData.foodDates).map(label => 
              api.saveFoodRecord(currentId, {
                label,
                date: childData.foodDates![label],
                category: childData.foodCategories?.[label] || ""
              })
            ));
          }

          // --- KROK 5: VÁHA / VÝŠKA ---
          if (childData.wh) {
            childData.wh = await api.syncWeightHeights(currentId, childData.wh);
          }

          // --- KROK 6: ZUBY ---
          if (childData.teethRecords) await api.syncTeethRecords(currentId, childData.teethRecords);

          // --- KROK 7: SLOVA ---
          if (childData.words) {
            childData.words = await api.syncWords(currentId, childData.words);
          }

          // Pokud až sem bez throw, dítě kompletně zesynchronizované
          syncedIds.push(originalId);

        } catch (err) {
          console.warn(`[SYNC] Dítě ${childData.name} selhalo, zkusím příště.`, err);
        }
      }

      // --- MAZÁNÍ FRONTY ---
      await processDeletionQueue("pending_child_deletions", (id) => api.deleteChild(id));
      await processDeletionQueue("pending_milestone_deletions", (i) => api.deleteMilestone(i.childId, i.milId));
      await processDeletionQueue("pending_word_deletions", (i) => api.deleteWord(i.childId, i.wordId));
      await processDeletionQueue("pending_wh_deletions", (i) => api.deleteWeightHeight(i.childId, i.whId));

      if (syncedIds.length > 0) {
        const remaining = { ...pendingUpdates };
        syncedIds.forEach(id => delete remaining[id]);
        await AsyncStorage.setItem("pending_child_updates", JSON.stringify(remaining));
      }

      return syncedIds;
      
    } catch (error) {
      console.error("[SYNC] Kritická chyba v syncOfflineData:", error);
      return [];
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  const reloadChildren = useCallback(async () => {
    const safeParse = (data: string | null, fallback: any) => {
      try {
        return data ? JSON.parse(data) : fallback;
      } catch {
        return fallback;
      }
    };

    const mergeEntities = <T extends { id: string | number; name: string }>(
      apiData: T[],
      localData: T[] | undefined,
      deletedIds: string[]
    ): T[] => {
      // 1. Odfiltrujeme z API dat ty, které jsou ve frontě ke smazání
      const filteredApi = apiData.filter(item => !deletedIds.includes(item.id.toString()));

      // 2. Vytvoříme sadu ID, která už v API jsou
      const apiIds = new Set(filteredApi.map(e => e.id.toString()));
      // 3. Vytvoříme sadu jmen pro extra sychr
      const apiNames = new Set(filteredApi.map(e => e.name.toLowerCase()));

      // 4. Do výsledku vezmeme vše z API + lokální věci, které:
      //    a) začínají na "local-" (ještě nebyly odeslány)
      //    b) AND jejich jméno ještě není v API (prevence duplicity jména)
      const localOnly = (localData || []).filter(le => {
        const isLocal = le.id.toString().startsWith("local-");
        const nameExistsInApi = apiNames.has(le.name.toLowerCase());
        const idExistsInApi = apiIds.has(le.id.toString());
        
        return isLocal && !nameExistsInApi && !idExistsInApi;
      });

      return [...filteredApi, ...localOnly];
    };

    // 1. Načtení z disku (rychlý start)
    const stored = await AsyncStorage.getItem("children");
    const localDataBeforeFetch = safeParse(stored, []) as Child[];
    if (localDataBeforeFetch.length > 0) {
        setAllChildren(localDataBeforeFetch);
    }

    try {
      const syncedIds = await syncOfflineData();
      
      const [childrenFromAPI, offlineDataStr] = await Promise.all([
        api.fetchChildren().catch(() => []),
        AsyncStorage.getItem("pending_child_updates")
      ]);
      
      const pending = safeParse(offlineDataStr, {});
      const apiIds = childrenFromAPI.map((c: any) => c.id);
      const onlyLocalChildren = localDataBeforeFetch.filter(lc => !apiIds.includes(lc.id));

      const enrichedChildren = await Promise.all(
        childrenFromAPI.map(async (apiChild: Child) => {
          const isChildPending = !!pending[apiChild.id];
          const isFreshlySynced = syncedIds.includes(apiChild.id);
          const local = localDataBeforeFetch.find(c => c.id === apiChild.id);

          // POKUD PENDING NEBO FRESHLY SYNCED, VĚŘÍME LOKÁLNÍ CACHE
          if (isChildPending || isFreshlySynced) {
            if (local) return local;
          }

          const currentChild = { ...apiChild };

          // --- Denní záznamy ---
          currentChild.sleepRecords = mergeByDate(
            await api.fetchSleepRecords(apiChild.id).catch(() => []), 
            local?.sleepRecords || [],
            isChildPending
          );
          currentChild.breastfeedingRecords = mergeByDate(
            await api.fetchBreastfeedingRecords(apiChild.id).catch(() => []), 
            local?.breastfeedingRecords || [],
            isChildPending
          );

          // --- Entity s ID (Milníky, Slova) ---
          const milDeletesStr = await AsyncStorage.getItem("pending_milestone_deletions");
          const milDeletes = milDeletesStr ? JSON.parse(milDeletesStr).map((d: any) => d.milId) : [];
          const wordDeletesStr = await AsyncStorage.getItem("pending_word_deletions");
          const wordDeletes = wordDeletesStr ? JSON.parse(wordDeletesStr).map((d: any) => d.wordId) : [];

          currentChild.milestones = mergeEntities(
            await api.fetchMilestones(apiChild.id).catch(() => []), 
            local?.milestones,
            milDeletes
          );
          currentChild.words = mergeEntities(
            await api.fetchWords(apiChild.id).catch(() => []), 
            local?.words,
            wordDeletes
          );

          // --- Zuby a WH (OPRAVA TADY!) ---
          // Pokud je dítě pending, nesmíme přebít naše data prázdným/starým polem z API
          if (isChildPending) {
            currentChild.teethRecords = local?.teethRecords || [];
            currentChild.wh = local?.wh || [];
          } else {
            currentChild.teethRecords = await api.fetchTeethRecords(apiChild.id).catch(() => []);
            currentChild.wh = await api.fetchWeightHeights(apiChild.id).catch(() => []);
          }

          // --- Jídlo (OPRAVA TADY!) ---
          if (isChildPending && local?.foodDates) {
            currentChild.foodDates = local.foodDates;
            currentChild.foodCategories = local.foodCategories;
          } else {
            try {
              const apiFood = await api.fetchFoodRecords(apiChild.id);
              const apiDates: FoodDates = {};
              const apiCats: Record<string, string> = {};
              apiFood.forEach((rec: any) => {
                apiDates[rec.food_name] = rec.date || "";
                apiCats[rec.food_name] = rec.category || "";
              });
              currentChild.foodDates = apiDates;
              currentChild.foodCategories = apiCats;
            } catch {
              currentChild.foodDates = local?.foodDates || {};
            }
          }

          return currentChild;
        })
      );

      const finalChildren = [...enrichedChildren, ...onlyLocalChildren];
      setAllChildren(finalChildren);
      await AsyncStorage.setItem("children", JSON.stringify(finalChildren));
    } catch (error) {
      console.warn("[RELOAD] Offline nebo chyba API.");
    }
  }, [syncOfflineData]);

  // Inicializace
  useEffect(() => {
    const initData = async () => {
      // 1. Načteme naposledy vybrané ID z paměti telefonu
      const storedId = await AsyncStorage.getItem("selectedChildId");
      if (storedId) {
        setSelectedChildIdState(storedId);
      }

      // 2. Načteme data
      await reloadChildren();
    };

    initData();
 
  }, [reloadChildren]);

  const setSelectedChildId = useCallback(async (id: string | null) => {
    setSelectedChildIdState(id);
    if (id) {
      await AsyncStorage.setItem("selectedChildId", id);
    } else {
      await AsyncStorage.removeItem("selectedChildId");
    }
  }, []);

  // 2. UPDATE (Ukládá do fronty při chybě)
  const updateChild = useCallback(async (updatedChild: Child) => {
    setAllChildren(prev => {
      const exists = prev.some(c => c.id === updatedChild.id);
      return exists ? prev.map(c => c.id === updatedChild.id ? updatedChild : c) : [...prev, updatedChild];
    });

    // Uložit lokálně a do fronty
    const current = safeParse(await AsyncStorage.getItem("children"), []);
    const updatedList = current.some((c:any) => c.id === updatedChild.id)
       ? current.map((c:any) => c.id === updatedChild.id ? updatedChild : c)
       : [...current, updatedChild];

    const pending = safeParse(await AsyncStorage.getItem("pending_child_updates"), {});
    pending[updatedChild.id] = updatedChild;

    await Promise.all([
      AsyncStorage.setItem("children", JSON.stringify(updatedList)),
      AsyncStorage.setItem("pending_child_updates", JSON.stringify(pending))
    ]);

    syncOfflineData(); 
  }, [syncOfflineData]);

  const deleteChild = useCallback(async (childId: string) => {
    // 1. Okamžitě z UI a lokální cache
    const updatedChildren = allChildren.filter(c => c.id !== childId);
    setAllChildren(updatedChildren);
    await AsyncStorage.setItem("children", JSON.stringify(updatedChildren));

    // 2. Pokud je to aktuálně vybrané dítě, zrušíme výběr
    if (selectedChildId === childId) {
      await setSelectedChildId(null);
    }

    // 3. Odstraníme z fronty čekajících změn 
    const offlineData = await AsyncStorage.getItem("pending_child_updates");
    if (offlineData) {
      const pending = JSON.parse(offlineData);
      if (pending[childId]) {
        delete pending[childId];
        await AsyncStorage.setItem("pending_child_updates", JSON.stringify(pending));
      }
    }

    // --- FRONTA NA SMAZÁNÍ ---
    try {
      await api.deleteChild(childId);
    } catch (err: any) {
      if (err.message.includes("404")) {
      } else {
        // OFFLINE: ID do seznamu k odstranění
        console.warn("[DELETE] Server nedostupný, ukládám do fronty ke smazání.");
        const toDeleteStr = await AsyncStorage.getItem("pending_child_deletions");
        const toDelete: string[] = toDeleteStr ? JSON.parse(toDeleteStr) : [];
        
        if (!toDelete.includes(childId)) {
          toDelete.push(childId);
          await AsyncStorage.setItem("pending_child_deletions", JSON.stringify(toDelete));
        }
      }
    }
  }, [allChildren, selectedChildId, setSelectedChildId]);

  const deleteWeightHeightRecord = useCallback(async (childId: string, whId: string) => {
    // 1. Aktualizace lokálního stavu
    setAllChildren(prev => {
      const newList = prev.map(child => {
        if (child.id === childId) {
          return { 
            ...child, 
            wh: (child.wh || []).filter(r => r.id !== whId) 
          };
        }
        return child;
      });

      // OKAMŽITÝ zápis na disk, aby po router.replace byla data už tam
      AsyncStorage.setItem("children", JSON.stringify(newList));
      return newList;
    });

    // 2. Server / Offline fronta
    if (whId.toString().startsWith("local-")) return;

    try {
      await api.deleteWeightHeight(childId, whId);
    } catch (err) {
      const existing = await AsyncStorage.getItem("pending_wh_deletions");
      const list = existing ? JSON.parse(existing) : [];
      list.push({ childId, whId });
      await AsyncStorage.setItem("pending_wh_deletions", JSON.stringify(list));
    }
  }, []);

  const saveAllChildren = useCallback(
    async (children: Child[]) => {
      await AsyncStorage.setItem("children", JSON.stringify(children));
      setAllChildren(children);
    },
    []
  );

  return (
    <ChildContext.Provider
      value={{
        selectedChild,
        selectedChildId,
        setSelectedChildId,
        allChildren,
        saveAllChildren,
        updateChild,
        reloadChildren,
        deleteChild: deleteChild, // Mapujeme funkci na klíč deleteChild
        deleteWeightHeightRecord,
      }}
    >
      {children}
    </ChildContext.Provider>
  );
};

export const useChild = () => {
  const context = useContext(ChildContext);
  if (!context) throw new Error("useChild must be used within a ChildProvider");
  return context;
};