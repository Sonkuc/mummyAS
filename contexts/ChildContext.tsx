import * as api from "@/components/storage/api";
import { BASE_URL } from "@/components/storage/api";
import * as utils from "@/components/storage/context/syncService";
import { BreastfeedingSyncDay, Child, ChildUpdate, DiaryCreate, DiaryUpdate, FoodRecord, Milestone, SleepSyncDay, WeightHeight, Word } from "@/components/storage/interfaces";
import { useAuth } from "@/contexts/AuthContext";
import { createDemoChildren } from "@/lib/demoData";
import { isGuestMode } from "@/lib/guest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ChildContextType = {
  selectedChild: Child | null;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => Promise<void>;
  allChildren: Child[];
  updateChild: (childData: Partial<Child> & { id: string }) => Promise<void>;
  reloadChildren: () => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  updateSleepDayRecord: (childId: string, date: string, sleepData: SleepSyncDay, currentModeSleep?: Child["currentModeSleep"]) => Promise<void>;
  updateBreastfeedingDayRecord: (childId: string, date: string, bfData: BreastfeedingSyncDay, currentModeFeed?: { mode: "start" | "stop"; start: string } | null) => Promise<void>;
  addWeightHeightRecord: (childId: string, record: Omit<WeightHeight, 'id' | 'child_id'>) => Promise<void>;
  updateWeightHeightRecord: (childId: string, whId: string, updatedEntry: any) => Promise<void>;
  deleteWeightHeightRecord: (childId: string, whId: string) => Promise<void>;
  updateFoodRecord: (childId: string, foodRecords: FoodRecord[]) => Promise<void>;
  deleteFoodRecord: (childId: string, foodId: string) => Promise<void>;
  addDiaryRecord: (childId: string, diaryData: DiaryCreate) => Promise<void>;
  updateDiaryRecord: (childId: string, diaryId: string, data: DiaryUpdate) => Promise<void>;
  deleteDiaryRecord: (childId: string, diaryId: string) => Promise<void>;
  addMilestoneRecord: (childId: string, milestone: Omit<Milestone, 'id' | 'child_id'>) => Promise<void>;
  updateMilestoneRecord: (childId: string, milId: string, updatedData: Partial<Milestone>) => Promise<void>;
  deleteMilestoneRecord: (childId: string, milId: string) => Promise<void>;
  addWordRecord: (childId: string, wordName: string, date: string, note?: string) => Promise<void>;
  updateWordRecord: (childId: string, wordId: string, name: string, entries: any[]) => Promise<void>;
  deleteWordRecord: (childId: string, wordId: string) => Promise<void>;
  updateTeethRecord: (childId: string, teethRecords: any[]) => Promise<void>;
  isDataLoaded: boolean;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
  const { session, user, isGuest } = useAuth();
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const syncInProgress = useRef(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const allChildrenRef = useRef<Child[]>([]);
  useEffect(() => {
    allChildrenRef.current = allChildren;
  }, [allChildren]);

  // Zkušební režim: ukázková data se nahrají jen jednou při vstupu do režimu
  const guestSeeded = useRef(false);
  useEffect(() => {
    if (isGuest) {
      if (guestSeeded.current) return;
      guestSeeded.current = true;
      // Zkušební režim: ukázková data jen v paměti
      setAllChildren(createDemoChildren());
      setSelectedChildIdState(null);
      setIsDataLoaded(true);
      return;
    }
    guestSeeded.current = false;
    if (!session) {
      setAllChildren([]);
      setSelectedChildIdState(null);
      AsyncStorage.removeItem("selectedChildId");
    }
  }, [session, isGuest]);

  const selectedChild = useMemo(() => {
    return allChildren.find(c => c.id === selectedChildId) || null;
  }, [allChildren, selectedChildId]);

  // Pomocník pro zápis do cache
  const updateLocalCache = async (newList: Child[]) => {
    if (isGuestMode()) return; // zkušební režim: nic neukládat
    await AsyncStorage.setItem("children", JSON.stringify(newList));
  };

  const processAllDeletions = useCallback(async (userId: string) => {
    // Spustí všechny fronty smazání paralelně
    await Promise.all([
      utils.processDeletionQueue("pending_child_deletions", (id) => 
        api.deleteChild(id, userId)
      ),
      utils.processDeletionQueue("pending_milestone_deletions", (i) => 
        api.deleteMilestone(i.childId, i.milId, userId)
      ),
      utils.processDeletionQueue("pending_word_deletions", (i) => 
        api.deleteWord(i.childId, i.wordId, userId)
      ),
      utils.processDeletionQueue("pending_diary_deletions", (i) => 
        api.deleteDiaryEntry(i.childId, userId, i.diaryId)
      ),
      utils.processDeletionQueue("pending_food_deletions", (i) => 
        api.deleteFoodRecord(i.childId, i.foodLabel, userId)
      ),
      utils.processDeletionQueue("pending_bf_day_deletions", (i) => 
        api.updateBreastfeedingDay(i.childId, i.date, [], userId)
      ),
      utils.processDeletionQueue("pending_sleep_day_deletions", (i) => 
        api.updateSleepDay(i.childId, i.date, [], userId)
      ),
    ]);
  }, []);

  const syncOfflineData = useCallback(async (userId?: string) => {
    if (syncInProgress.current) return [];
    const currentUserId = userId || user?.id;
    if (!currentUserId) return [];

    syncInProgress.current = true;

    try {
      try {
        // Můžeš použít dedikovaný endpoint (např. /health nebo /profiles) s malým timeoutem
        // Pokud tento fetch selže, víme, že jsme offline a rovnou končíme.
        await fetch(`${BASE_URL}/profiles`, { method: 'HEAD' });
      } catch (netErr) {
        console.log("ℹ️ [SYNC] Backend je nedostupný, synchronizace odložena.");
        return []; // Tímto vyskočíme a nespustíme žádné cykly ani processAllDeletions
      }
      const offlineData = await AsyncStorage.getItem("pending_child_updates");
      
      if (!offlineData) {
        await processAllDeletions(currentUserId);
        return [];
      }

      const pendingUpdates: Record<string, Child> = JSON.parse(offlineData);
      const syncedIds: string[] = [];

      for (const [originalId, childData] of Object.entries(pendingUpdates)) {
        try {
          // Update základních info a návrat "pravdy" z DB
          await api.updateChild(originalId, childData, currentUserId);

          // 1. Hromadné sekce (Milníky, Slova, Zuby, Váha, Jídlo)
          await Promise.all([
            api.syncWeightHeights(originalId, childData.wh || [], currentUserId),
            api.syncTeethRecords(originalId, currentUserId, childData.teethRecords || []),
            api.syncFoodRecords(originalId, childData.foodRecords || [], currentUserId),
            api.syncMilestones(originalId, childData.milestones || [], currentUserId),
            api.syncWords(originalId, childData.words || [], currentUserId),
          ]);

          // 2. Denní záznamy (Spánek, Kojení) - seskupeno podle data uvnitř helperu
          await utils.syncSectionByDate(originalId, currentUserId, childData.sleepRecords || [], api.updateSleepDay);
          await utils.syncSectionByDate(originalId, currentUserId, childData.breastfeedingRecords || [], api.updateBreastfeedingDay);
          
          // 3. Deník (pokud není hromadný sync na backendu)
          if (childData.diaryRecords) {
            for (const record of childData.diaryRecords) {
              const { id, ...diaryData } = record;
              if (id.startsWith("local-")) {
                await api.createDiaryEntry(originalId, currentUserId, diaryData);
              } else {
                await api.updateDiaryEntry(originalId, currentUserId, id, diaryData);
              }
            }
          }

          syncedIds.push(originalId);
        } catch (err) {
          console.warn(`[SYNC] Dítě ${childData.name} selhalo`, err);
        }
      }

      // 5. Vyřízení smazaných věcí
      await processAllDeletions(currentUserId);

      // 6. Vyčištění fronty
      if (syncedIds.length > 0) {
        const remaining = { ...pendingUpdates };
        syncedIds.forEach(id => delete remaining[id]);
        await AsyncStorage.setItem("pending_child_updates", JSON.stringify(remaining));
      }

      return syncedIds;
    } catch (error) {
      console.error("[SYNC] Kritická chyba:", error);
      return [];
    } finally {
      syncInProgress.current = false;
    }
  }, [user, processAllDeletions]);

  const reloadChildren = useCallback(async () => {
    if (isGuestMode()) {
      setIsDataLoaded(true);
      return;
    }
    if (!user?.id) return;
  
    setIsDataLoaded(false);

    try {
      // Pokud nelze navázat spojení, vyvoláme chybu dřív, než dojde k fetchChildren
      await fetch(`${BASE_URL}/profiles`, { method: 'HEAD' });

      // Synchronizace offline dat (pokud jsme online)
      await syncOfflineData(user.id);
      
      // Fetch čerstvých dat z API
      const childrenFromAPI = await api.fetchChildren(user.id);

      const pendingStr = await AsyncStorage.getItem("pending_child_updates");
      const pending = pendingStr ? JSON.parse(pendingStr) : {};
      const bfDeletionsStr = await AsyncStorage.getItem("pending_bf_day_deletions");
      const bfDeletions = bfDeletionsStr ? JSON.parse(bfDeletionsStr) : [];
      const sleepDeletionsStr = await AsyncStorage.getItem("pending_sleep_day_deletions");
      const sleepDeletions = sleepDeletionsStr ? JSON.parse(sleepDeletionsStr) : [];
      
      const currentLocalChildren = allChildrenRef.current;

      const mergedChildren = childrenFromAPI.map(apiChild => {
        const localChild = currentLocalChildren.find(c => c.id === apiChild.id);

        const apiBfRecords = (apiChild.breastfeedingRecords || []).filter(rec => 
          !bfDeletions.some((del: any) => del.childId === apiChild.id && del.date === rec.date)
        );
        const apiSleepRecords = (apiChild.sleepRecords || []).filter(rec => 
          !sleepDeletions.some((del: any) => del.childId === apiChild.id && del.date === rec.date)
        );

        const cleanedApiChild = {
          ...apiChild,
          breastfeedingRecords: apiBfRecords,
          sleepRecords: apiSleepRecords,
          // Preserve local timer states — API has timezone-bugged auto-computed values
          currentModeSleep: localChild?.currentModeSleep ?? apiChild.currentModeSleep,
          currentModeFeed: localChild?.currentModeFeed ?? apiChild.currentModeFeed,
        };

        if (pending[cleanedApiChild.id]) {
          return localChild || cleanedApiChild;
        }
        return cleanedApiChild;
      });

      setAllChildren(mergedChildren);
      await updateLocalCache(mergedChildren);
      setIsDataLoaded(true);

    } catch (error) {
      console.log("ℹ️ [OFFLINE REŽIM] Načítám kompletní data dětí z lokální cache.");
      
      try {
        const stored = await AsyncStorage.getItem("children");
        if (stored) {
          const parsedChildren = JSON.parse(stored);
          setAllChildren(parsedChildren);
        }
      } catch (cacheError) {
        console.error("Chyba při čtení dětí z cache:", cacheError);
      } finally {
        setIsDataLoaded(true);
      }
    }
  }, [user, syncOfflineData]);

  // Inicializace při mountu / změně usera
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      if (!user) return;
      try {
        setIsDataLoaded(false); // Defenzivní nastavení na false před začátkem
        const storedId = await AsyncStorage.getItem("selectedChildId");
        if (storedId && isMounted) {
          setSelectedChildIdState(storedId);
        }
        await reloadChildren();
      } catch (e) {
        console.error("Chyba při inicializaci ChildProvideru:", e);
        setIsDataLoaded(true);
      }
    };

    initData();
    return () => { isMounted = false; };
  }, [user, reloadChildren]);

  // --- SETTER ID ---
  const setSelectedChildId = useCallback(async (id: string | null) => {
    setSelectedChildIdState(id);
    await utils.setStoredSelectedChildId(id);
  }, []);

  // ============ CHILD ============
  const updateChild = useCallback(async (childData: Partial<Child> & { id: string }) => {
    // 1. Lokální update (Optimistické UI)
    const exists = allChildren.some(c => c.id === childData.id);
    const updatedChild = exists 
      ? { ...allChildren.find(c => c.id === childData.id), ...childData } as Child 
      : childData as Child;
    const finalDispatchList = exists 
      ? allChildren.map(c => c.id === childData.id ? updatedChild : c)
      : [...allChildren, updatedChild];

    setAllChildren(prev => {
      const found = prev.some(c => c.id === childData.id);
      if (found) return prev.map(c => c.id === childData.id ? { ...c, ...childData } : c);
      return [...prev, childData as Child];
    });
    await updateLocalCache(finalDispatchList);

    // 2. API Sync
    try {
      if (!exists) {
        await api.createChild(childData, user!.id);
      } else {
        const updatePayload: ChildUpdate = {
          name: childData.name,
          birthDate: childData.birthDate,
          sex: childData.sex,
          photo: childData.photo,
          currentModeFeed: childData.currentModeFeed,
          currentModeSleep: childData.currentModeSleep,
        };
        await api.updateChild(childData.id, updatePayload, user!.id);
      }
    } catch (err) {
      console.log("[OFFLINE] Update uložen do pending fronty");
      await utils.handleSyncError(childData.id, finalDispatchList);
    }
  }, [allChildren, user, updateLocalCache]);

  const deleteChild = useCallback(async (childId: string) => {
    // 1. Lokální odstranění
    const updatedChildren = allChildren.filter(c => c.id !== childId);
    setAllChildren(updatedChildren);
    await updateLocalCache(updatedChildren);
    // 2. Vyčistit z fronty čekajících změn (pokud tam bylo nové/upravené dítě)
    const pendingStr = await AsyncStorage.getItem("pending_child_updates");
    if (pendingStr) {
      const pending = JSON.parse(pendingStr);
      if (pending[childId]) {
        delete pending[childId];
        await AsyncStorage.setItem("pending_child_updates", JSON.stringify(pending));
      }
    }
    if (selectedChildId === childId) {
      await setSelectedChildId(null);
    }
    // 3. API Sync nebo Deletion Queue
    try {
      await api.deleteChild(childId, user!.id);
    } catch (err: any) {
      // Pokud chyba není 404 (již smazáno), přidáme do fronty na smazání
      if (!err?.message?.includes("404")) {
        await utils.addToDeletionQueue("pending_child_deletions", childId);
      }
    }
  }, [allChildren, selectedChildId, setSelectedChildId, updateLocalCache, user]);

  const updateBreastfeedingDayRecord = useCallback(
    async (
      childId: string,
      date: string,
      bfData: BreastfeedingSyncDay,
      currentModeFeed?: Child["currentModeFeed"]
    ) => {

      // 1. Optimistický update (aby UI ihned reagovalo před dokončením API requestu)
      const buildUpdatedList = (modeFeed: Child["currentModeFeed"]) =>
        allChildren.map((child) => {
          if (child.id !== childId) return child;
          const otherDaysRecords = (child.breastfeedingRecords || []).filter(r => r.date !== date);
          const recordsWithChildId = bfData.map(item => ({
            ...item,
            child_id: childId,
            id: item.id || `local-${Date.now()}-${Math.random()}` // Generování ID pokud chybí
          }));

          // Pokud volající nepředal explicitní stav časovače, dopočítáme ho
          // ze stejné logiky jako backend: poslední záznam dne určuje aktivní mód.
          let resolvedModeFeed = modeFeed;
          if (modeFeed === undefined) {
            if (bfData.length > 0) {
              const sortedData = [...bfData].sort((a, b) => a.time.localeCompare(b.time));
              const lastRec = sortedData[sortedData.length - 1];
              resolvedModeFeed = { mode: lastRec.state, start: new Date(`${date}T${lastRec.time}:00`).toISOString() };
            } else {
              resolvedModeFeed = null;
            }
          }

          return {
            ...child,
            breastfeedingRecords: [...otherDaysRecords, ...recordsWithChildId],
            currentModeFeed: resolvedModeFeed,
          };
        });

      // provizorní stav do UI
      const provisionalList = buildUpdatedList(currentModeFeed);
      setAllChildren(provisionalList);
      await updateLocalCache(provisionalList);

      // 2. Odeslání na API
      try {
        const shouldClearTimer = currentModeFeed === null;
        const apiResponse = await api.updateBreastfeedingDay(childId, date, bfData, user!.id, shouldClearTimer);

        const finalList = provisionalList.map((child) => {
          if (child.id !== childId) return child;
          const otherDaysRecords = (child.breastfeedingRecords || []).filter(r => r.date !== date);

          // Server je zdroj pravdy; provisional (resolvedModeFeed) je jen fallback,
          // kdyby z nějakého důvodu apiResponse neobsahovala currentModeFeed.
          const finalModeFeed = currentModeFeed !== undefined
            ? currentModeFeed
            : apiResponse.currentModeFeed !== undefined
              ? apiResponse.currentModeFeed
              : child.currentModeFeed;

          return {
            ...child,
            breastfeedingRecords: [...otherDaysRecords, ...apiResponse.records],
            currentModeFeed: finalModeFeed,
          };
        });

        setAllChildren(finalList);
        await updateLocalCache(finalList);

      } catch (err) {
        console.log("Offline nebo chyba: Záznam ukládáme optimisticky do cache");
        await updateLocalCache(provisionalList);
        await utils.handleSyncError(childId, provisionalList);

        if (bfData.length === 0) {
          await utils.addToDeletionQueue("pending_bf_day_deletions", { childId, date });
        }
      }
    },
    [allChildren, user, updateLocalCache]
  );

  // ============ SLEEP ============
  const updateSleepDayRecord = useCallback(
    async (
      childId: string,
      date: string,
      sleepData: SleepSyncDay,
      currentModeSleep?: Child["currentModeSleep"]
    ) => {

      const buildUpdatedList = (modeSleep: Child["currentModeSleep"]) =>
        allChildren.map((child) => {
          if (child.id !== childId) return child;

          const otherDaysRecords = (child.sleepRecords || []).filter(r => r.date !== date);
          const recordsWithChildId = sleepData.map(item => ({
            ...item,
            child_id: childId,
            id: item.id || `local-${Date.now()}-${Math.random()}`
          }));

          let resolvedModeSleep = modeSleep;
          if (modeSleep === undefined) {
            if (sleepData.length > 0) {
              const sortedData = [...sleepData].sort((a, b) => a.time.localeCompare(b.time));
              const lastRec = sortedData[sortedData.length - 1];
              resolvedModeSleep = { mode: lastRec.state, start: new Date(`${date}T${lastRec.time}:00`).toISOString() };
            } else {
              resolvedModeSleep = null;
            }
          }

          return {
            ...child,
            sleepRecords: [...otherDaysRecords, ...recordsWithChildId],
            currentModeSleep: resolvedModeSleep,
          };
        });

      const provisionalList = buildUpdatedList(currentModeSleep);
      setAllChildren(provisionalList);
      await updateLocalCache(provisionalList);

      try {
        const shouldClearTimer = currentModeSleep === null;
        const apiResponse = await api.updateSleepDay(childId, date, sleepData, user!.id, shouldClearTimer);

        const finalList = provisionalList.map((child) => {
          if (child.id !== childId) return child;
          const otherDaysRecords = (child.sleepRecords || []).filter(r => r.date !== date);

          const finalModeSleep = currentModeSleep !== undefined
            ? currentModeSleep          // explicit null (reset) or explicit object (new record) — trust the client
            : apiResponse.currentModeSleep !== undefined
              ? apiResponse.currentModeSleep
              : child.currentModeSleep;

          return {
            ...child,
            sleepRecords: [...otherDaysRecords, ...apiResponse.records],
            currentModeSleep: finalModeSleep,
          };
        });

        setAllChildren(finalList);
        await updateLocalCache(finalList);

      } catch (err) {
        console.log("Offline nebo chyba: Záznam spánku ukládáme optimisticky do cache");
        await updateLocalCache(provisionalList);
        await utils.handleSyncError(childId, provisionalList);

        if (sleepData.length === 0) {
          await utils.addToDeletionQueue("pending_sleep_day_deletions", { childId, date });
        }
      }
    },
    [allChildren, user, updateLocalCache]
  );

  // ============ WEIGHT & HEIGHT ============
  const addWeightHeightRecord = useCallback(async (childId: string, entry: Omit<WeightHeight, 'id' | 'child_id'>) => {
    const localId = `local-${Date.now()}`;
    const newFullEntry = { ...entry, id: localId, child_id: childId };
    // 1. Příprava dat (UI + Cache)
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      return { ...child, wh: [...(child.wh || []), newFullEntry] };
    });
    setAllChildren(newList);
    await updateLocalCache(newList);

    // 2. API Sync / Pending Queue
    try {
      const childData = newList.find(c => c.id === childId);
      if (childData) {
        await api.syncWeightHeights(childId, childData.wh || [], user!.id);
      }
    } catch (err) {
      console.log("Offline: WH záznam uložen do pending_child_updates");
      await utils.handleSyncError(childId, newList);
    }
  }, [allChildren, user, updateLocalCache]);

  const updateWeightHeightRecord = useCallback(async (childId: string, whId: string, updatedEntry: any) => {
    // 1. Příprava nového seznamu
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      const newWhList = (child.wh || []).map(w => 
        w.id === whId ? { ...updatedEntry, id: whId, child_id: childId } : w
      );
      return { ...child, wh: newWhList };
    });
    // 2. Update UI i Cache
    setAllChildren(newList);
    await updateLocalCache(newList);
    // 3. API Sync / Pending Queue
    try {
      const childData = newList.find(c => c.id === childId);
      if (childData) {
        await api.syncWeightHeights(childId, childData.wh || [], user!.id);
      }
    } catch (err) {
      console.log("Offline: WH edit uložen do pending");
      await utils.handleSyncError(childId, newList);
    }
  }, [allChildren, user, updateLocalCache]);

  const deleteWeightHeightRecord = useCallback(async (childId: string, whId: string) => {
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      return { ...child, wh: (child.wh || []).filter(r => r.id !== whId) };
    });
    
    setAllChildren(newList);
    await updateLocalCache(newList);

    await utils.removeFromPendingUpdates(childId, 'wh', whId);

    if (whId.toString().startsWith("local-")) return;

    try {
      const childData = newList.find(c => c.id === childId);
      await api.syncWeightHeights(childId, childData?.wh || [], user!.id);
    } catch (err) {
      console.log("Offline: Smazání WH uloženo do fronty");
      await utils.addToDeletionQueue("pending_wh_deletions", { childId, whId });
    }
  }, [allChildren, user, updateLocalCache]);

  // ============ FOOD ============
  const updateFoodRecord = useCallback(async (childId: string, foodRecords: FoodRecord[]) => {
    // 1. Příprava dat
    const newList = allChildren.map(child => 
      child.id === childId ? { ...child, foodRecords } : child
    );
    // 2. Update UI i Cache
    setAllChildren(newList);
    await updateLocalCache(newList); 
    // 3. API Sync
    try {
      await api.syncFoodRecords(childId, foodRecords, user!.id);
    } catch (err) {
      console.log("Offline: Ukládám jídlo do fronty");
      await utils.handleSyncError(childId, newList);
    }
  }, [allChildren, user, updateLocalCache]);

  const deleteFoodRecord = useCallback(async (childId: string, foodName: string) => {
    // 1. UI & Cache Update
    const newList = allChildren.map(child => 
      child.id === childId
        ? { ...child, foodRecords: (child.foodRecords || []).filter(r => r.food_name !== foodName) }
        : child
    );
    setAllChildren(newList);
    await updateLocalCache(newList);

    // 2. Odstranění z fronty čekajících uploadů (pokud tam bylo)
    await utils.removeFromPendingUpdates(childId, 'foodRecords', foodName, 'food_name');

    // 3. API volání / Mazací fronta pomocí helperu
    try {
      await api.deleteFoodRecord(childId, foodName, user!.id);
    } catch (err) {
      await utils.addToDeletionQueue("pending_food_deletions", { childId, foodName });
    }
  }, [allChildren, user, updateLocalCache]);

  // ============ DIARY ============
  const addDiaryRecord = useCallback(async (childId: string, entry: DiaryCreate) => {
    const localId = `local-${Date.now()}`;
    const newFullEntry = { ...entry, id: localId, child_id: childId };
    // 1. Příprava dat (UI + Cache)
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      return { ...child, diaryRecords: [newFullEntry, ...(child.diaryRecords || [])] };
    });
    // Update UI i Cache naráz
    setAllChildren(newList);
    await updateLocalCache(newList);
    // 2. API Sync / Pending Queue
    try {
      await api.createDiaryEntry(childId, user!.id, entry);
    } catch (err) {
      console.log("Offline: Diary záznam uložen do pending_child_updates");
      await utils.handleSyncError(childId, newList);
    }
  }, [allChildren, user, updateLocalCache]);

  const updateDiaryRecord = useCallback(async (
    childId: string, 
    diaryId: string, 
    updates: DiaryUpdate
  ) => {
    // 1. Příprava dat
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      const updatedRecords = (child.diaryRecords || []).map(rec => 
        rec.id === diaryId ? { ...rec, ...updates } : rec
      );
      return { ...child, diaryRecords: updatedRecords };
    });

    setAllChildren(newList);
    // 2. Update UI a Cache
    await updateLocalCache(newList);

    // 3. API Sync / Pending Queue
    try {
      if (diaryId.toString().startsWith("local-")) {
        console.log("Editace lokálního záznamu - sync proběhne při celkovém odeslání");
        await utils.handleSyncError(childId, newList);
      } else {
        await api.updateDiaryEntry(childId, user!.id, diaryId, updates);
      }
    } catch (err) {
      console.log("Offline: Update deníku uložen do pending_child_updates");
      await utils.handleSyncError(childId, newList);
    }
  }, [allChildren, user, updateLocalCache]);

  const deleteDiaryRecord = useCallback(async (childId: string, diaryId: string) => {
    // 1. UI update + Cache
    const newList = allChildren.map(child => 
      child.id === childId
        ? { ...child, diaryRecords: (child.diaryRecords || []).filter(r => r.id !== diaryId) }
        : child
    );
    
    setAllChildren(newList);
    await updateLocalCache(newList);
    // 2. Vyčistíme i z fronty čekajících uploadů
    await utils.removeFromPendingUpdates(childId, 'diaryRecords', diaryId);
    // 3. Pokud je lokální, končíme
    if (diaryId.toString().startsWith("local-")) return;
    // 4. API / Mazací fronta pomocí helperu
    try {
      await api.deleteDiaryEntry(childId, user!.id, diaryId);
    } catch (err) {
      console.log("Offline: Mazání deníku uloženo do fronty");
      await utils.addToDeletionQueue("pending_diary_deletions", { childId, diaryId });
    }
  }, [allChildren, user, updateLocalCache]);

  // ============ WORDS ============
  const addWordRecord = useCallback(async (childId: string, wordName: string, date: string, note?: string) => {
    const newEntry = { date, note: note?.trim() || "" };
    const localId = `local-${Date.now()}`;
    // 1. Příprava dat (UI + Cache)
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      const newWord: Word = { 
        id: localId, 
        child_id: childId, 
        name: wordName.trim(), 
        entries: [{ ...newEntry, id: `entry-${Date.now()}` }] 
      };
      return { ...child, words: [...(child.words || []), newWord] };
    });

    setAllChildren(newList);
    await updateLocalCache(newList);
    // 2. API volání přes createWord
    try {
      await api.createWord(childId, { name: wordName.trim(), entries: [newEntry] }, user!.id);
    } catch (err) {
      console.log("Offline: Slovo uloženo do pending_child_updates");
      await utils.handleSyncError(childId, newList);
    }
  }, [allChildren, user, updateLocalCache]);

  const updateWordRecord = useCallback(async (childId: string, wordId: string, name: string, entries: any[]) => {
    // 1. Příprava dat
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      return {
        ...child,
        words: (child.words || []).map(w => 
          w.id === wordId ? { ...w, name: name.trim(), entries } : w
        )
      };
    });
    setAllChildren(newList);
    await updateLocalCache(newList);

    // 2. API volání
    try {
      const cleanEntries = entries.map(({ id, ...rest }) => ({
        ...rest,
        note: rest.note || ""
      }));
      await api.updateWord(childId, wordId, { name: name.trim(), entries: cleanEntries }, user!.id);
    } catch (err) {
      console.log("Offline: Update slova uložen do pending");
      await utils.handleSyncError(childId, newList);
    }
  }, [allChildren, user, updateLocalCache]);

  const deleteWordRecord = useCallback(async (childId: string, wordId: string) => {
    // 1. UI update + Cache
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      const updatedWords = (child.words || []).filter(w => w.id !== wordId);
      return { ...child, words: updatedWords };
    });
    setAllChildren(newList);
    await updateLocalCache(newList);
    // 2. Vyčistit z fronty čekajících uploadů
    await utils.removeFromPendingUpdates(childId, 'words', wordId);
    // 3. Pokud je lokální, končíme
    if (wordId.toString().startsWith("local-")) return;
    // 4. API / Mazací fronta pomocí helperu
    try {
      await api.deleteWord(childId, wordId, user!.id);
    } catch (err) {
      console.log("Offline: Smazání slova uloženo do fronty");
      await utils.addToDeletionQueue("pending_word_deletions", { childId, wordId });
    }
  }, [allChildren, user, updateLocalCache]);

  // ============ TEETH ============
  const updateTeethRecord = useCallback(async (childId: string, teethRecords: any[]) => {
    // 1. Příprava dat
    const newList = allChildren.map(child => 
      child.id === childId ? { ...child, teethRecords } : child
    );
    setAllChildren(newList);
    // 2. Update UI a Cache
    await updateLocalCache(newList);
    // 3. API Sync / Offline Fronta
    try {
      await api.syncTeethRecords(childId, user!.id, teethRecords);
    } catch (err) {
      console.log("Offline: Zuby uloženy do pending_child_updates");
      await utils.handleSyncError(childId, newList);
    }
  }, [allChildren, user, updateLocalCache]);

  // ============ MILESTONES ============
  const addMilestoneRecord = useCallback(async (childId: string, data: Omit<Milestone, 'id' | 'child_id'>) => {
    const tempId = `local-${Date.now()}`;
    const tempRecord: Milestone = { ...data, id: tempId, child_id: childId };
    // 1. Příprava dat (UI + Cache)
    const updatedList = allChildren.map(child => {
      if (child.id !== childId) return child;
      return {
        ...child,
        milestones: [...(child.milestones || []), tempRecord]
      };
    });
    setAllChildren(updatedList);
    await updateLocalCache(updatedList);
    // 2. API Sync / Pending Queue
    try {
      const targetChild = updatedList.find(c => c.id === childId);
      // Voláme hromadný sync
      const syncedMilestones = await api.syncMilestones(childId, targetChild?.milestones || [], user!.id);

      // Pokud sync prošel, aktualizujeme stav i cache s ostrými ID z DB
      const finalChildren = updatedList.map(child => 
        child.id === childId ? { ...child, milestones: syncedMilestones } : child
      );
      setAllChildren(finalChildren);
      await updateLocalCache(finalChildren);
    } catch (err) {
      console.log("Offline: Milník uložen do pending_child_updates");
      await utils.handleSyncError(childId, updatedList);
    }
  }, [allChildren, user, updateLocalCache]);

  const updateMilestoneRecord = useCallback(async (childId: string, milestoneId: string, data: Partial<Milestone>) => {
    // 1. Příprava nového stavu
    const updatedChildren = allChildren.map(child => {
      if (child.id !== childId) return child;
      return {
        ...child,
        milestones: (child.milestones || []).map(m => 
          m.id.toString() === milestoneId.toString() ? { ...m, ...data } : m
        )
      };
    });
    // 2. Update UI a Cache naráz
    setAllChildren(updatedChildren);
    await updateLocalCache(updatedChildren);
    // 3. API Sync / Offline Fronta
    try {
      const childToSync = updatedChildren.find(c => c.id === childId);
      if (childToSync) {
        await api.syncMilestones(childId, childToSync.milestones || [], user!.id);
      }
    } catch (err) {
      console.log("Offline: Update milníku uložen do pending");
      await utils.handleSyncError(childId, updatedChildren);
    }
  }, [allChildren, user, updateLocalCache]);

  const deleteMilestoneRecord = useCallback(async (childId: string, milId: string) => {
    // 1. UI update + Cache
    const newList = allChildren.map(child => {
      if (child.id !== childId) return child;
      const updatedMilestones = (child.milestones || []).filter(
        m => m.id.toString() !== milId.toString()
      );
      return { ...child, milestones: updatedMilestones };
    });
    setAllChildren(newList);
    await updateLocalCache(newList);
    // 2. Vyčistit z fronty čekajících uploadů
    await utils.removeFromPendingUpdates(childId, 'milestones', milId);
    // 3. Pokud je lokální, končíme
    if (milId.toString().startsWith("local-")) return;
    // 4. API / Mazací fronta pomocí helperu
    try {
      await api.deleteMilestone(childId, milId, user!.id);
    } catch (err) {
      console.log("Offline: Smazání milníku uloženo do fronty");
      await utils.addToDeletionQueue("pending_milestone_deletions", { childId, milId });
    }
  }, [allChildren, user, updateLocalCache]);

  return (
    <ChildContext.Provider
    value={{
      // 1. Základní stav a ID
      selectedChild,
      selectedChildId,
      setSelectedChildId,
      allChildren,
      isDataLoaded,

      // 2. CHILD (Základní operace)
      updateChild,
      deleteChild,
      reloadChildren,

      updateBreastfeedingDayRecord,
      updateSleepDayRecord,
      addWeightHeightRecord,
      updateWeightHeightRecord,
      deleteWeightHeightRecord,
      updateFoodRecord,
      deleteFoodRecord,
      addDiaryRecord,
      updateDiaryRecord,
      deleteDiaryRecord,
      addWordRecord,
      updateWordRecord,
      deleteWordRecord,
      updateTeethRecord,
      addMilestoneRecord,
      updateMilestoneRecord,
      deleteMilestoneRecord,
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