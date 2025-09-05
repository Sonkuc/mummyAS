import { Child } from "@/components/storage/SaveChildren";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text } from "react-native";

type Props = {
  type: "child" | "milestone" | "word" | "wh"; // rozšiř podle potřeby
  index: number;
  onDeleteSuccess?: () => void;
};

export default function DeleteButton({ type, index, onDeleteSuccess }: Props) {
  const router = useRouter();
  const {
    selectedChildIndex,
    setSelectedChildIndex,
    allChildren,
    saveAllChildren,
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
              // Pokud mažu celé dítě
              if (type === "child") {
                const updated = allChildren.filter((_, i) => i !== index);
                await saveAllChildren(updated);

                if (selectedChildIndex === index) {
                  await setSelectedChildIndex(updated.length > 0 ? 0 : -1);
                }

                router.replace("/");
                alert("Dítě bylo smazáno.");
                return;
              }

              // Typy polí na dítěti
              const fieldMap = {
                milestone: "milestones",
                word: "words",
                wh: "wh",
              } as const;

              type FieldType = keyof typeof fieldMap; // "milestone" | "word" | "wh"
              type FieldKey = typeof fieldMap[FieldType]; // "milestones" | "words" | "whs"

              const fieldKey = fieldMap[type as FieldType] as FieldKey;

              if (selectedChildIndex !== null && fieldKey) {
                const selected = allChildren[selectedChildIndex];
                
                const currentArray = (selected[fieldKey] ?? []) as any[];

                const updatedArray = currentArray.filter((_, i) => i !== index);
                
                const updatedChild: Child = {
                  ...selected,
                  [fieldKey]: updatedArray,
                };

                const updatedAll = allChildren.map((child, i) =>
                  i === selectedChildIndex ? updatedChild : child
                );

                await saveAllChildren(updatedAll);
                onDeleteSuccess?.();
                alert("Záznam byl smazán.");
              }
            } catch (err) {
              alert("Chyba při mazání záznamu.");
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