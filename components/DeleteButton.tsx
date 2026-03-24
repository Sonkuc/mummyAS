import * as api from "@/components/storage/api";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, Text } from "react-native";

type Props = {
  type: "child" | "milestone" | "word" | "wh" | "tooth" | "diary"; 
  childId: string; 
  recordId?: string;
  onDeleteSuccess?: () => void;
};

export default function DeleteButton({ type, childId, recordId, onDeleteSuccess }: Props) {
  const router = useRouter();
  const { deleteChild, updateChild, allChildren, deleteWeightHeightRecord } = useChild();

  const handleDelete = async () => {
    Alert.alert(
      "Smazat",
      "Opravdu chceš tento záznam odstranit?",
      [
        { text: "Zrušit", style: "cancel" },
        {
          text: "Smazat",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. SMAZÁNÍ CELÉHO DÍTĚTE
              if (type === "child") {
                await deleteChild(childId);
                router.replace("/home");
                return;
              }

              // 2. LOKÁLNÍ AKTUALIZACE STAVU (UI)
              if (!recordId) return;
              const child = allChildren.find(c => c.id === childId);
              if (!child) return;

              const updatedChild = { ...child };

              // Rozřazení podle typu - čistě a bez duplicit
              if (type === "milestone") {
                updatedChild.milestones = child.milestones?.filter(r => r.id !== recordId);
              } else if (type === "word") {
                updatedChild.words = child.words?.filter(w => w.id !== recordId);
              } else if (type === "wh") {
                updatedChild.wh = child.wh?.filter(r => r.id !== recordId);
              } else if (type === "tooth") {
                updatedChild.teethRecords = child.teethRecords?.filter(r => r.id !== recordId);
              } else if (type === "diary") {
                updatedChild.diaryRecords = child.diaryRecords?.filter(r => r.id !== recordId);
              }

              // Uložíme do cache a pokusíme se o celkový update (pokud je Child update endpoint)
              await updateChild(updatedChild);
              
              // 3. SERVEROVÉ SMAZÁNÍ KONKRÉTNÍCH ENTIT (OFFLINE FRONTA)
              const isLocalId = recordId.toString().startsWith("local-");

              // --- SEKCE MILNÍKY ---
              if (type === "milestone" && !isLocalId) {
                try {
                  await api.deleteMilestone(childId, recordId);
                } catch (err) {
                  console.warn("[OFFLINE] Milník do fronty");
                  const stored = await AsyncStorage.getItem("pending_milestone_deletions");
                  const queue = stored ? JSON.parse(stored) : [];
                  queue.push({ childId, milId: recordId });
                  await AsyncStorage.setItem("pending_milestone_deletions", JSON.stringify(queue));
                }
              }

              // --- SEKCE SLOVA ---
              if (type === "word" && !isLocalId) {
                try {
                  await api.deleteWord(childId, recordId);
                } catch (err) {
                  console.warn("[OFFLINE] Slovo do fronty");
                  const stored = await AsyncStorage.getItem("pending_word_deletions");
                  const queue = stored ? JSON.parse(stored) : [];
                  queue.push({ childId, wordId: recordId });
                  await AsyncStorage.setItem("pending_word_deletions", JSON.stringify(queue));
                }
              }

              // --- SEKCE VÁHA A VÝŠKA (WH) ---
              if (type === "wh") {
                // Místo ručního skládání objektu a updateChild zavolej přímo dedikovanou funkci z Contextu
                // (Nezapomeň si přidat deleteWeightHeightRecord do destrukturalizace z useChild())
                await deleteWeightHeightRecord(childId, recordId);
                
                onDeleteSuccess?.();
                return; 
              }


              onDeleteSuccess?.();
            } catch (err) {
              console.error("Chyba při mazání:", err);
              Alert.alert("Chyba", "Nepodařilo se záznam odstranit.");
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={handleDelete}
      style={{
        position: "absolute",
        right: 10,
        top: 35,
        padding: 5,
        zIndex: 10,
      }}
    >
      <Text style={{ fontSize: 30 }}>🚮</Text>
    </Pressable>
  );
}