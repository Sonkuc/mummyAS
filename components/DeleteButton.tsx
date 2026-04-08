import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, Text } from "react-native";

type Props = {
  type: "child" | "milestone" | "word" | "wh" | "diary"; 
  childId: string; 
  recordId?: string;
  onDeleteSuccess?: () => void;
};

export default function DeleteButton({ type, childId, recordId, onDeleteSuccess }: Props) {
  const router = useRouter();
  const { 
    deleteChild, 
    deleteWeightHeightRecord, 
    deleteDiaryRecord,
    deleteMilestoneRecord,
    deleteWordRecord
  } = useChild();

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
      switch (type) {
        case "child":
          await deleteChild(childId);
          router.replace("/home");
          break;
        case "wh":
          await deleteWeightHeightRecord(childId, recordId!);
          break;
        case "diary":
          await deleteDiaryRecord(childId, recordId!);
          break;
        case "milestone":
          await deleteMilestoneRecord(childId, recordId!);
          break;
        case "word":
          await deleteWordRecord(childId, recordId!);
          break;
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