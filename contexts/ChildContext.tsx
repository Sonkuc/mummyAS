import { loadChildren } from "@/components/storage/LoadChildren"; // <- ujisti se, že cesta sedí
import { Child } from "@/components/storage/SaveChildren";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ChildContextType = {
  selectedChild: Child | null;
  selectedChildIndex: number | null;
  setSelectedChildIndex: (index: number | null, refresh?: boolean) => Promise<void>;
  setSelectedChild: (child: Child | null) => Promise<void>;
  allChildren: Child[];
  saveAllChildren: (children: Child[]) => Promise<void>;
  updateChild: (child: Child) => Promise<void>;
  reloadChildren: () => Promise<void>;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [selectedChildIndex, setSelectedChildIndexState] = useState<number | null>(null);
  const selectedChild = selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;

  useEffect(() => {
    const loadChildrenFromStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem("children");
        if (stored) {
          const parsed: Child[] = JSON.parse(stored);
          setAllChildren(parsed);
        }

        const storedIndex = await AsyncStorage.getItem("selectedChildIndex");
        if (storedIndex !== null) {
          setSelectedChildIndexState(Number(storedIndex));
        }
      } catch (e) {
        console.error("Error loading children or selected index", e);
      }
    };

    loadChildrenFromStorage();
  }, []);

  // reloadChildren: načte data z AsyncStorage a nastaví allChildren
  const reloadChildren = useCallback(async () => {
    const children = await loadChildren();
    setAllChildren(children);
  }, []);

  // setSelectedChildIndex: zapis index a volitelně reload
  const setSelectedChildIndex = useCallback(
    async (index: number | null, refresh = false) => {
      // uložíme index lokálně
      setSelectedChildIndexState(index);

      // persist do AsyncStorage
      if (index !== null) {
        await AsyncStorage.setItem("selectedChildIndex", index.toString());
      } else {
        await AsyncStorage.removeItem("selectedChildIndex");
      }

      // pokud chceme refreshnout data, přenačteme children z úložiště
      if (index !== null && refresh) {
        await reloadChildren();
        // po reloadu nastavit index znovu, aby selectedChild ukazoval správně
        setSelectedChildIndexState(index);
      }
    },
    [reloadChildren]
  );

  const setSelectedChild = useCallback(
    async (child: Child | null) => {
      if (child === null) {
        setSelectedChildIndexState(null);
        await AsyncStorage.removeItem("selectedChildIndex");
        return;
      }

      const index = allChildren.findIndex(c => c.id === child.id);
      if (index !== -1) {
        await setSelectedChildIndex(index);
      } else {
        console.warn("Child not found in allChildren");
      }
    },
    [allChildren, setSelectedChildIndex]
  );

  const updateChild = useCallback(
    async (updatedChild: Child) => {
      const newChildren = allChildren.map(c =>
        c.id === updatedChild.id ? updatedChild : c
      );
      await AsyncStorage.setItem("children", JSON.stringify(newChildren));
      setAllChildren(newChildren);

      // zajistit rerender selectedChild, pokud existuje
      if (selectedChildIndex !== null && newChildren[selectedChildIndex]) {
        setSelectedChildIndexState(selectedChildIndex);
      }
    },
    [allChildren, selectedChildIndex]
  );
  
  const saveAllChildren = useCallback(
    async (children: Child[]) => {
      await AsyncStorage.setItem("children", JSON.stringify(children));
      setAllChildren(children);

      if (selectedChildIndex !== null && children[selectedChildIndex]) {
        setSelectedChildIndexState(selectedChildIndex);
      }
    },
    [selectedChildIndex]
  );

  return (
    <ChildContext.Provider
      value={{
        selectedChild,
        setSelectedChild,
        selectedChildIndex,
        setSelectedChildIndex,
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
  if (!context) {
    throw new Error("useChild must be used within a ChildProvider");
  }
  return context;
};