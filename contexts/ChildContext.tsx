import * as api from "@/components/storage/api";
import * as utils from "@/components/storage/context/syncService";
import { Child, DiaryUpdate } from "@/components/storage/interfaces";
import { useAuth } from "@/contexts/AuthContext";
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
  deleteFoodRecord: (childId: string, foodId: string) => Promise<void>;
  deleteDiaryRecord: (childId: string, diaryId: string) => Promise<void>;
  deleteMilestoneRecord: (childId: string, milId: string) => Promise<void>;
  deleteWordRecord: (childId: string, wordId: string) => Promise<void>;
  updateDiaryRecord: (childId: string, diaryId: string, data: DiaryUpdate) => Promise<void>;
  isDataLoaded: boolean;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
  const { session, user } = useAuth();
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const syncInProgress = useRef(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (!session) {
      setAllChildren([]);
      setSelectedChildIdState(null);
      AsyncStorage.removeItem("selectedChildId");
    }
  }, [session]);

  const selectedChild = useMemo(() => {
    return allChildren.find(c => c.id === selectedChildId) || null;
  }, [allChildren, selectedChildId]);

  // Pomocník pro zápis do cache
  const updateLocalCache = async (newList: Child[]) => {
    await AsyncStorage.setItem("children", JSON.stringify(newList));
  };

  const syncOfflineData = useCallback(async (userId?: string) => {
    if (syncInProgress.current) return [];

    const currentUserId = userId || user?.id;

    if (!currentUserId) {
      console.warn("LOG: SyncOfflineData přerušen - userId není k dispozici");
      return [];
    }
    
    console.log("LOG: Start syncOfflineData pro uživatele:", currentUserId);
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
          await api.updateChild(currentId, childData, currentUserId);

          // --- KROK 1 & 2: DENNÍ ZÁZNAMY ---
          await utils.syncDailyRecords(
            currentId, 
            childData.sleepRecords, 
            api.updateSleepDay, 
            api.fetchSleepRecords
          );
          await utils.syncDailyRecords(
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
            if (childData.foodRecords) {
              // 1. Zjistíme aktuální stav na serveru
              const remoteFoods = await api.fetchFoodRecords(currentId).catch(() => []);
              
              // 2. Najdeme jídla, která jsou na serveru, ale v lokální (childData) verzi už nejsou
              const toDelete = remoteFoods.filter(rf => 
                !childData.foodRecords?.some(lf => lf.food_name === rf.food_name)
              );

              // 3. Smažeme je ze serveru
              await Promise.all(toDelete.map(rf => 
                api.deleteFoodRecord(currentId, rf.food_name).catch(() => null)
              ));

              // 4. Uložíme zbytek (vytvoření/update)
              await Promise.all(childData.foodRecords.map(rec => 
                api.saveFoodRecord(currentId, {
                  label: rec.food_name,
                  date: rec.date,
                  category: rec.category,
                  note: rec.note
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

          // --- KROK 8: DENÍK ---
          if (childData.diaryRecords) {
            const updatedDiary = [];
            for (const record of childData.diaryRecords) {
              if (record.id.toString().startsWith("local-")) {
                // VYTVOŘENÍ NOVÉHO
                try {
                  const { id, ...rest } = record;
                  const savedRecord = await api.createDiaryEntry(currentId, rest as any);
                  updatedDiary.push(savedRecord);
                } catch (err) {
                  console.warn("[SYNC] Vytvoření záznamu v deníku selhalo", err);
                  updatedDiary.push(record);
                }
              } else {
                // AKTUALIZACE STÁVAJÍCÍHO (Tohle ti chybělo!)
                try {
                  const { id, created_at, ...updateData } = record;
                  const updated = await api.updateDiaryEntry(currentId, id, updateData as any);
                  updatedDiary.push(updated);
                } catch (err) {
                  console.warn("[SYNC] Update záznamu v deníku selhal", err);
                  updatedDiary.push(record); // Necháme v pending pro příště
                }
              }
            }
            childData.diaryRecords = updatedDiary;
          }

          // Pokud až sem bez throw, dítě kompletně zesynchronizované
          syncedIds.push(originalId);

        } catch (err) {
          console.warn(`[SYNC] Dítě ${childData.name} selhalo, zkusím příště.`, err);
        }
      }

      // --- MAZÁNÍ FRONTY ---
      await utils.processDeletionQueue("pending_child_deletions", (id) => api.deleteChild(id, currentUserId));
      await utils.processDeletionQueue("pending_milestone_deletions", (i) => api.deleteMilestone(i.childId, i.milId));
      await utils.processDeletionQueue("pending_word_deletions", (i) => api.deleteWord(i.childId, i.wordId));
      await utils.processDeletionQueue("pending_wh_deletions", (i) => api.deleteWeightHeight(i.childId, i.whId));
      await utils.processDeletionQueue("pending_diary_deletions", (i) => api.deleteDiaryEntry(i.childId, i.diaryId));

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
    if (!user || !user.id) {
      console.log("LOG: reloadChildren - Uživatel zatím není k dispozici (null), přeskakuji.");
      return;
    }
    console.log("LOG: reloadChildren - Start pro uživatele:", user.id);

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
    const localDataBeforeFetch = utils.safeParse(stored, []) as Child[];
    if (localDataBeforeFetch.length > 0) {
        setAllChildren(localDataBeforeFetch);
    }

    try {
      const syncedIds = await syncOfflineData(user.id);
      
      const [childrenFromAPI, offlineDataStr] = await Promise.all([
        api.fetchChildren(user.id).catch(() => []),
        AsyncStorage.getItem("pending_child_updates")
      ]);
      
      const pending = utils.safeParse(offlineDataStr, {});
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

          // --- Načtení front pro smazání (aby smazané věci znovu nevyskočily) ---
          const [milDeletesStr, wordDeletesStr, foodDeletesStr, diaryDeletesStr] = await Promise.all([
            AsyncStorage.getItem("pending_milestone_deletions"),
            AsyncStorage.getItem("pending_word_deletions"),
            AsyncStorage.getItem("pending_food_deletions"), 
            AsyncStorage.getItem("pending_wh_deletions"),
            AsyncStorage.getItem("pending_diary_deletions"),
          ]);

          const milDeletes = milDeletesStr ? JSON.parse(milDeletesStr).map((d: any) => d.milId) : [];
          const wordDeletes = wordDeletesStr ? JSON.parse(wordDeletesStr).map((d: any) => d.wordId) : [];
          const foodDeletes = foodDeletesStr ? JSON.parse(foodDeletesStr) : []; 
          const diaryDeletes = diaryDeletesStr ? JSON.parse(diaryDeletesStr) : [];

          // --- Denní záznamy (Beze změny) ---
          currentChild.sleepRecords = utils.mergeByDate(
            await api.fetchSleepRecords(apiChild.id).catch(() => []), 
            local?.sleepRecords || [],
            isChildPending
          );
          currentChild.breastfeedingRecords = utils.mergeByDate(
            await api.fetchBreastfeedingRecords(apiChild.id).catch(() => []), 
            local?.breastfeedingRecords || [],
            isChildPending
          );

          // --- Entity s ID (Milníky, Slova) ---
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

          // --- Zuby a WH ---
          if (isChildPending) {
            currentChild.teethRecords = local?.teethRecords || [];
            currentChild.wh = local?.wh || [];
          } else {
            currentChild.teethRecords = await api.fetchTeethRecords(apiChild.id).catch(() => []);
            currentChild.wh = await api.fetchWeightHeights(apiChild.id).catch(() => []);
          }

          // --- JÍDLO ---
          if (isChildPending) {
            currentChild.foodRecords = local?.foodRecords || [];
          } else {
            try {
              const remoteFoods = await api.fetchFoodRecords(apiChild.id);
              
              // FILTRACE: Zahodíme jídla, která jsou na serveru, ale v lokální frontě čekají na smazání
              currentChild.foodRecords = remoteFoods.filter(rf => 
                !foodDeletes.some((d: any) => d.childId === apiChild.id && d.foodName === rf.food_name)
              );
            } catch {
              currentChild.foodRecords = local?.foodRecords || [];
            }
          }

          // --- DENÍK ---
          if (isChildPending) {
            currentChild.diaryRecords = local?.diaryRecords || [];
          } else {
            const remoteDiary = await api.fetchDiaryEntries(apiChild.id).catch(() => []);
            const filteredApiDiary = remoteDiary.filter(rd => !diaryDeletes.includes(rd.id));
            
            // Získáme lokální záznamy, které ještě nejsou na serveru
            // Kontrola podle ID (local-) AND obsahu (prevence duplicity po syncu)
            const localNewDiary = (local?.diaryRecords || []).filter(ld => {
              const isLocal = ld.id.startsWith("local-");
              const alreadyOnServer = filteredApiDiary.some(rd => 
                rd.name === ld.name && rd.text === ld.text && rd.date === ld.date
              );
              return isLocal && !alreadyOnServer;
            });
            
            currentChild.diaryRecords = [...filteredApiDiary, ...localNewDiary];
          }
          return currentChild;
        })
      );

      const finalChildren = [...enrichedChildren, ...onlyLocalChildren];
      setAllChildren(finalChildren);
      setIsDataLoaded(true);
      await AsyncStorage.setItem("children", JSON.stringify(finalChildren));
    } catch (error) {
      console.warn("[RELOAD] Offline nebo chyba API.");
    }
  }, [user, syncOfflineData]);

  // Inicializace
  useEffect(() => {
    const initData = async () => {
      // Pokud user ještě není (isLoading v AuthContextu), nic nedělej a počkej
      if (!user) {
        console.log("LOG: initData - uživatel zatím není k dispozici, čekám...");
        return;
      }

      try {
        console.log("LOG: initData - uživatel nalezen, spouštím reload a sync.");
        const storedId = await AsyncStorage.getItem("selectedChildId");
        if (storedId) setSelectedChildIdState(storedId);

        // Spustíme reload, který v sobě má i sync
        await reloadChildren();
      } catch (e) {
        console.error("Chyba při inicializaci ChildProvideru:", e);
      }
    };

    initData();
  }, [user, reloadChildren]);

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
    const current = utils.safeParse(await AsyncStorage.getItem("children"), []);
    const updatedList = current.some((c:any) => c.id === updatedChild.id)
       ? current.map((c:any) => c.id === updatedChild.id ? updatedChild : c)
       : [...current, updatedChild];

    const pending = utils.safeParse(await AsyncStorage.getItem("pending_child_updates"), {});
    pending[updatedChild.id] = updatedChild;

    await Promise.all([
      AsyncStorage.setItem("children", JSON.stringify(updatedList)),
      AsyncStorage.setItem("pending_child_updates", JSON.stringify(pending))
    ]);

    syncOfflineData(); 
  }, [syncOfflineData]);

  const updateDiaryRecord = useCallback(async (childId: string, diaryId: string, data: DiaryUpdate) => {
    // 1. Lokální aktualizace pro okamžitou odezvu v UI
    let updatedChildClone: Child | null = null;

    setAllChildren(prev => {
      const newList = prev.map(child => {
        if (child.id !== childId) return child;
        
        const updatedChild = {
          ...child,
          diaryRecords: child.diaryRecords?.map(r => 
            r.id === diaryId ? { ...r, ...data } : r
          )
        };
        updatedChildClone = updatedChild; // Uložíme si referenci pro AsyncStorage
        return updatedChild;
      });
      return newList;
    });

    // 2. Zápis do lokální cache (aby data přežila zavření aplikace)
    if (updatedChildClone) {
      const stored = utils.safeParse(await AsyncStorage.getItem("children"), []);
      const newList = stored.map((c: any) => c.id === childId ? updatedChildClone : c);
      await AsyncStorage.setItem("children", JSON.stringify(newList));
    }

    // 3. Pokus o API volání
    try {
      await api.updateDiaryEntry(childId, diaryId, data);
      // Pokud prošlo, můžeme zkusit odstranit z pending, pokud tam bylo
      await utils.removeFromPendingUpdates(childId, 'diaryRecords', diaryId);
    } catch (err) {
      console.log("Offline: Ukládám update deníku do fronty pending_child_updates");
      
      // 4. Pokud selže, přidáme celé dítě do fronty (tvůj stávající systém)
      if (updatedChildClone) {
        const pending = utils.safeParse(await AsyncStorage.getItem("pending_child_updates"), {});
        pending[childId] = updatedChildClone;
        await AsyncStorage.setItem("pending_child_updates", JSON.stringify(pending));
      }
    }
  }, []);

  const deleteChild = useCallback(async (childId: string) => {
    const updatedChildren = allChildren.filter(c => c.id !== childId);
    setAllChildren(updatedChildren);
    await updateLocalCache(updatedChildren);

    // Vyčistit z fronty čekajících změn (pokud tam bylo nové dítě)
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

    try {
      await api.deleteChild(childId, user!.id);
    } catch (err: any) {
      if (!err?.message?.includes("404")) {
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
    setAllChildren(prev => {
      const newList = prev.map(child => child.id === childId 
        ? { ...child, wh: (child.wh || []).filter(r => r.id !== whId) } 
        : child
      );
      updateLocalCache(newList); // Sjednocený zápis
      return newList;
    });

    await utils.removeFromPendingUpdates(childId, 'wh', whId);

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

  const deleteFoodRecord = useCallback(async (childId: string, foodName: string) => {
    setAllChildren(prev => {
      const newList = prev.map(child => child.id === childId
        ? { ...child, foodRecords: (child.foodRecords || []).filter(r => r.food_name !== foodName) }
        : child
      );
      updateLocalCache(newList);
      return newList;
    });

    await utils.removeFromPendingUpdates(childId, 'foodRecords', foodName, 'food_name');

    try {
      await api.deleteFoodRecord(childId, foodName);
    } catch (err) {
      const existing = await AsyncStorage.getItem("pending_food_deletions");
      const list = existing ? JSON.parse(existing) : [];
      list.push({ childId, foodName });
      await AsyncStorage.setItem("pending_food_deletions", JSON.stringify(list));
    }
  }, []);

  const deleteDiaryRecord = useCallback(async (childId: string, diaryId: string) => {
    // 1. UI update + Cache
    setAllChildren(prev => {
      const newList = prev.map(child => child.id === childId
        ? { ...child, diaryRecords: (child.diaryRecords || []).filter(r => r.id !== diaryId) }
        : child
      );
      updateLocalCache(newList);
      return newList;
    });

    // Vyčistíme i z fronty čekajících uploadů
    await utils.removeFromPendingUpdates(childId, 'diaryRecords', diaryId);

    // 2. Pokud je lokální, končíme
    if (diaryId.toString().startsWith("local-")) return;

    // 3. API / Fronta smazání
    try {
      await api.deleteDiaryEntry(childId, diaryId);
    } catch (err) {
      const existing = await AsyncStorage.getItem("pending_diary_deletions");
      const list = existing ? JSON.parse(existing) : [];
      list.push({ childId, diaryId });
      await AsyncStorage.setItem("pending_diary_deletions", JSON.stringify(list));
    }
  }, []);

  const deleteWordRecord = useCallback(async (childId: string, wordId: string) => {
    // 1. UI update + Cache
    setAllChildren(prev => {
      const newList = prev.map(child => child.id === childId
        ? { ...child, words: (child.words || []).filter(w => w.id !== wordId) }
        : child
      );
      updateLocalCache(newList);
      return newList;
    });

    await utils.removeFromPendingUpdates(childId, 'words', wordId);

    // 2. Pokud je lokální, končíme
    if (wordId.toString().startsWith("local-")) return;

    // 3. API / Fronta smazání
    try {
      await api.deleteWord(childId, wordId);
    } catch (err) {
      const existing = await AsyncStorage.getItem("pending_word_deletions");
      const list = existing ? JSON.parse(existing) : [];
      list.push({ childId, wordId });
      await AsyncStorage.setItem("pending_word_deletions", JSON.stringify(list));
    }
  }, []);

  const deleteMilestoneRecord = useCallback(async (childId: string, milId: string) => {
    // 1. UI update + Cache
    setAllChildren(prev => {
      const newList = prev.map(child => child.id === childId
        ? { ...child, milestones: (child.milestones || []).filter(m => m.id !== milId) }
        : child
      );
      updateLocalCache(newList);
      return newList;
    });

    await utils.removeFromPendingUpdates(childId, 'milestones', milId);

    // 2. Pokud je lokální, končíme
    if (milId.toString().startsWith("local-")) return;

    // 3. API / Fronta smazání
    try {
      await api.deleteMilestone(childId, milId);
    } catch (err) {
      const existing = await AsyncStorage.getItem("pending_milestone_deletions");
      const list = existing ? JSON.parse(existing) : [];
      list.push({ childId, milId });
      await AsyncStorage.setItem("pending_milestone_deletions", JSON.stringify(list));
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
        deleteFoodRecord,
        deleteDiaryRecord,
        deleteMilestoneRecord,
        deleteWordRecord,
        updateDiaryRecord,
        isDataLoaded,
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