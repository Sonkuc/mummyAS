import * as api from "@/components/storage/api";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, Text } from "react-native";

type Props = {
  type: "child" | "milestone" | "word" | "wh" | "tooth"; 
  childId: string; 
  recordId?: string;
  onDeleteSuccess?: () => void;
};

export default function DeleteButton({ type, childId, recordId, onDeleteSuccess }: Props) {
  const router = useRouter();
  const { selectedChildId, setSelectedChildId, reloadChildren } = useChild();

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
              if (type === "child") {
                // 1. Smazání celého dítěte na serveru
                await api.deleteChild(childId);
                
                // Pokud mažu právě vybrané dítě, zruším výběr v kontextu
                if (selectedChildId === childId) {
                  await setSelectedChildId(null);
                }
                
                await reloadChildren();
                router.replace("/home");
                return;
              }

              // 2. Smazání dílčích záznamů (milníky, zuby, slova...)
              if (!recordId) return;

              if (type === "milestone") {
                await api.deleteMilestone(childId, recordId);
              } else if (type === "tooth") {
                await api.deleteTeethRecord(childId, recordId);
              } else if (type === "word") {
                await api.deleteWord(childId, recordId);
              } else if (type === "wh") {
                await api.deleteWeightHeight(childId, recordId);
              }
              // Přidat další typy dle api.ts

              // Po smazání záznamu refreshneme data
              await reloadChildren();
              onDeleteSuccess?.();
              
            } catch (err) {
              console.error("Chyba při mazání:", err);
              Alert.alert("Chyba", "Nepodařilo se záznam odstranit ze serveru.");
            }
          },
        },
      ],
      { cancelable: true }
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