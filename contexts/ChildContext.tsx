import * as api from "@/components/storage/api";
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
      const childrenFromAPI = await api.fetchChildren();

      const enrichedChildren = await Promise.all(
        childrenFromAPI.map(async (child: Child) => {
          try {
            // Paralelní načítání jídla (nebo jiných detailů, pokud nejsou v hlavním objektu)
            const foodRecords = await api.fetchFoodRecords(child.id);
            
            const foodDates: FoodDates = {};
            const foodCategories: Record<string, string> = {};

            foodRecords.forEach((rec: any) => {
              foodDates[rec.food_name] = rec.date || "";
              foodCategories[rec.food_name] = rec.category;
            });

            return { 
              ...child, 
              foodDates, 
              foodCategories 
              // Důležité: child.sleepRecords a breastfeedingRecords už musí mít ID z DB
            };
          } catch (e) {
            console.warn(`Nepodařilo se načíst jídlo pro dítě ${child.id}`, e);
            return child; 
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
      const storedId = await AsyncStorage.getItem("selectedChildId");
      if (storedId) setSelectedChildIdState(storedId);
      
      // Reload až po nastavení ID, aby aplikace hned věděla, co zobrazit
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

  // Místo celého objektu Child často jen změny
  const updateChild = useCallback(
    async (updatedChild: Child) => {
      try {
        // Nejprve API volání
        await api.updateChild(updatedChild.id, updatedChild);
        // Poté reload, aby se projevily i změny, které mohl vypočítat server
        await reloadChildren();
      } catch (e) {
        // Optimistický update v případě výpadku (offline)
        setAllChildren(prev => prev.map(c => 
          c.id === updatedChild.id ? { ...c, ...updatedChild } : c
        ));
        console.error("Update failed, using local fallback", e);
      }
    },
    [reloadChildren]
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