import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type FilterOption = "weight" | "height" | "head" | "clothes" | "foot";

type Props = {
  selected: FilterOption[];
  onChange: (newSelected: FilterOption[]) => void;
};

const labels: Record<FilterOption, string> = {
  weight: "⚖️",
  height: "📏",
  head: "👶",
  clothes: "👕",
  foot: "🦶",
};

export default function FilterButton({ selected, onChange }: Props) {
  const toggleOption = (option: FilterOption) => {
    const isSelected = selected.includes(option);
    const updated = isSelected
      ? selected.filter((o) => o !== option)
      : [...selected, option];
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      {Object.entries(labels).map(([key, label]) => (
        <Pressable
          key={key}
          style={[
            styles.option,
            selected.includes(key as FilterOption) && styles.selected,
          ]}
          onPress={() => toggleOption(key as FilterOption)}
        >
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: -10,
  },
  option: {
    padding: 10,
    margin: 5,
    borderRadius: 8,
    backgroundColor: "rgba(233, 200, 224, 1)",
  },
  selected: {
    backgroundColor: "#bae6c0ff",
  },
  label: {
    fontSize: 20,
    color: "white",
  },
});
