import { fetchChildren, fetchFoodRecords, updateChild as updateChildAPI } from "@/components/storage/api";
import { Child, FoodDates } from "@/components/storage/interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ChildContextType = {
  selectedChild: Child | null;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => Promise<void>;
  allChildren: Child[];
  updateChild: (child: Child) => Promise<void>;
  reloadChildren: () => Promise<void>;
  // saveAllChildren nechat pro masivní operace, ale většinou netřeba
  saveAllChildren: (children: Child[]) => Promise<void>;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);

  const selectedChild = useMemo(() => {
    return allChildren.find(c => c.id === selectedChildId) || null;
  }, [allChildren, selectedChildId]);

  const reloadChildren = useCallback(async () => {
  try {
    const childrenFromAPI = await fetchChildren();

    const enrichedChildren = await Promise.all(
      childrenFromAPI.map(async (child: Child) => {
        try {
          const foodRecords = await fetchFoodRecords(child.id);
          
          const foodDates: FoodDates = {};
          const foodCategories: Record<string, string> = {};

          foodRecords.forEach((rec: any) => {
            foodDates[rec.food_name] = rec.date || "";
            foodCategories[rec.food_name] = rec.category;
          });

          // DŮLEŽITÉ: Musíme zachovat vše, co přišlo z childrenFromAPI (včetně sleepRecords)
          // a k tomu přidat ty ztransformované foodDates
          return { 
            ...child, 
            foodDates, 
            foodCategories 
          };
        } catch (e) {
          console.warn(`Nepodařilo se načíst jídlo pro dítě ${child.id}`, e);
          return child; // Vrátíme dítě tak, jak je, bez foodDates
        }
      })
    );

    setAllChildren(enrichedChildren);
    await AsyncStorage.setItem("children", JSON.stringify(enrichedChildren));
  } catch (error) {
    console.error("Failed to reload children", error);
    const stored = await AsyncStorage.getItem("children");
    if (stored) setAllChildren(JSON.parse(stored));
  }
}, []);

  // Inicializace
  useEffect(() => {
    const initData = async () => {
      await reloadChildren();
      const storedId = await AsyncStorage.getItem("selectedChildId");
      if (storedId) setSelectedChildIdState(storedId);
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