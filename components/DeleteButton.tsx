import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text } from "react-native";

type Props = {
  type: "child" | "milestone" | "word"; // rozšiř podle potřeby
  index: number;
  onDeleteSuccess?: () => void;
};

export default function DeleteButton({ type, index, onDeleteSuccess }: Props) {
  const router = useRouter();
  const {
    selectedChild,
    selectedChildIndex,
    setSelectedChildIndex,
    allChildren,
    saveAllChildren,
  } = useChild();

  const handleDelete = async () => {
    Alert.alert(
    "Smazat dítě",
    "Opravdu chceš tento záznam smazat?",
    [
      { text: "Zrušit", style: "cancel" },
      {
        text: "Smazat",
        style: "destructive",
        onPress: async () => {
           try {
              if (type === "child") {
                const updated = allChildren.filter((_, i) => i !== index);
                await saveAllChildren(updated);

                // Pokud se smazal právě vybraný index, změň výběr
                if (selectedChildIndex === index) {
                  await setSelectedChildIndex(updated.length > 0 ? 0 : -1);
                }

                router.replace("/"); // přesměrování domů
              }

              if (type === "milestone" && selectedChildIndex !== null) {
                const selected = allChildren[selectedChildIndex];
                const updatedMilestones = (selected.milestones || []).filter((_, i) => i !== index);
                const updatedChild = { ...selected, milestones: updatedMilestones };

                const updatedAll = allChildren.map((child, i) =>
                  i === selectedChildIndex ? updatedChild : child
                );

                await saveAllChildren(updatedAll);
                onDeleteSuccess?.();
              }
              /*
              if (type === "word" && selectedChildIndex !== null) {
                const selected = allChildren[selectedChildIndex];
                const updatedWords = (selected.words || []).filter((_, i) => i !== index);
                const updatedChild = { ...selected, words: updatedWords };
              
                const updatedAll = allChildren.map((child, i) =>
                  i === selectedChildIndex ? updatedChild : child
                );
             
                await saveAllChildren(updatedAll);
                onDeleteSuccess?.();
              }
              */

              alert("Záznam byl smazán.");
            } catch (err) {
              console.error("Chyba při mazání:", err);
              alert("Chyba při mazání záznamu.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Pressable onPress={handleDelete}style={{ alignSelf: "flex-end", justifyContent: "center", marginBottom: -55 }}>
      <Text style={{ fontSize: 30 }}>🚮</Text>
    </Pressable>
  );
}
