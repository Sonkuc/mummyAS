import { fetchChildren, updateChild as updateChildAPI } from "@/components/storage/api";
import { Child } from "@/components/storage/SaveChildren";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ChildContextType = {
  selectedChild: Child | null;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => Promise<void>;
  allChildren: Child[];
  updateChild: (child: Child) => Promise<void>;
  reloadChildren: () => Promise<void>;
  // saveAllChildren můžeme nechat pro masivní operace, ale většinou už nebude třeba
  saveAllChildren: (children: Child[]) => Promise<void>;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);

  // 1. Výpočet aktuálního dítěte podle ID
  const selectedChild = useMemo(() => {
    return allChildren.find(c => c.id === selectedChildId) || null;
  }, [allChildren, selectedChildId]);

  // 2. Načtení dat při startu (API + ID z paměti)
  useEffect(() => {
    const initData = async () => {
      // Nejprve načteme děti
      try {
        const childrenFromAPI = await fetchChildren();
        setAllChildren(childrenFromAPI);
        await AsyncStorage.setItem("children", JSON.stringify(childrenFromAPI));
      } catch (error) {
        const stored = await AsyncStorage.getItem("children");
        if (stored) setAllChildren(JSON.parse(stored));
      }

      // Pak načteme ID vybraného dítěte
      const storedId = await AsyncStorage.getItem("selectedChildId");
      if (storedId) setSelectedChildIdState(storedId);
    };

    initData();
  }, []);

  const reloadChildren = useCallback(async () => {
    try {
      const children = await fetchChildren();
      setAllChildren(children);
      await AsyncStorage.setItem("children", JSON.stringify(children));
    } catch (error) {
      console.error("Failed to reload children", error);
    }
  }, []);

  const setSelectedChildId = useCallback(async (id: string | null) => {
    setSelectedChildIdState(id);
    if (id) {
      await AsyncStorage.setItem("selectedChildId", id);
    } else {
      await AsyncStorage.removeItem("selectedChildId");
    }
  }, []);

  const updateChild = useCallback(
    async (updatedChild: Child) => {
      try {
        await updateChildAPI(updatedChild.id, updatedChild);
        await reloadChildren();
      } catch (e) {
        const newChildren = allChildren.map(c =>
          c.id === updatedChild.id ? updatedChild : c
        );
        setAllChildren(newChildren);
        await AsyncStorage.setItem("children", JSON.stringify(newChildren));
      }
    },
    [allChildren, reloadChildren]
  );

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