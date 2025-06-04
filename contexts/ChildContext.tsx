import { Child } from "@/components/storage/SaveChildren";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type ChildContextType = {
  selectedChild: Child | null;
  setSelectedChild: (child: Child) => void;
  allChildren: Child[];
  saveAllChildren: (children: Child[]) => Promise<void>;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedChild, setSelectedChildState] = useState<Child | null>(null);
	const [allChildren, setAllChildren] = useState<Child[]>([]);

	useEffect(() => {
    const loadChildren = async () => {
      const stored = await AsyncStorage.getItem("children");
      if (stored) {
        const parsed: Child[] = JSON.parse(stored);
        setAllChildren(parsed);
      }

      const storedSelected = await AsyncStorage.getItem("selectedChild");
      if (storedSelected) {
        const parsed: Child = JSON.parse(storedSelected);
        setSelectedChildState(parsed);
      }
    };

    loadChildren();
  }, []);

  const setSelectedChild = async (child: Child) => {
    setSelectedChildState(child);
    await AsyncStorage.setItem("selectedChild", JSON.stringify(child));
  };

  const saveAllChildren = async (children: Child[]) => {
  await AsyncStorage.setItem("children", JSON.stringify(children));
  setAllChildren(children);
};

  return (
    <ChildContext.Provider value={{ selectedChild, setSelectedChild, allChildren, saveAllChildren,  }}>
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