import { Child } from "@/components/storage/SaveChildren";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ChildContextType = {
  selectedChild: Child | null;
  selectedChildIndex: number | null;
  setSelectedChildIndex: (index: number) => void;
  setSelectedChild: (child: Child | null) => void;
  allChildren: Child[];
  saveAllChildren: (children: Child[]) => Promise<void>;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
	const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [selectedChildIndex, setSelectedChildIndexState] = useState<number | null>(null);
  const selectedChild = selectedChildIndex !== null ? allChildren[selectedChildIndex] : null;

	useEffect(() => {
    const loadChildren = async () => {
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

    loadChildren();
  }, []);

  const setSelectedChildIndex = useCallback(async (index: number) => {
    setSelectedChildIndexState(index);
    await AsyncStorage.setItem("selectedChildIndex", index.toString());
  }, []);

  const setSelectedChild = useCallback(
    async (child: Child | null) => {
      if (child === null) {
        setSelectedChildIndexState(null);
        await AsyncStorage.removeItem("selectedChildIndex");
        return;
      }
      const index = allChildren.findIndex(c => c === child);
      if (index !== -1) {
        setSelectedChildIndex(index);
      } else {
        console.warn("Child not found in allChildren");
      }
    },
    [allChildren, setSelectedChildIndex]
  );

  const saveAllChildren = useCallback(async (children: Child[]) => {
    await AsyncStorage.setItem("children", JSON.stringify(children));
    setAllChildren(children);
  }, []);

  return (
    <ChildContext.Provider
      value={{
        selectedChild,
        setSelectedChild,
        selectedChildIndex,
        setSelectedChildIndex,
        allChildren,
        saveAllChildren,
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