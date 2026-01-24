import { COLORS } from "@/constants/MyColors";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { StyleSheet, View, useColorScheme } from "react-native";

type Option = {
  id: string;
  label: string;
};

type Props = {
  data: Option[];              // MILESTONES nebo WORDS
  selectedValue: string;       // selectedMilestone nebo selectedWord
  onChange: (id: string) => void;
  setName: (name: string) => void;
  placeholder?: string;        // Text pro první neaktivní položku
};

export default function MyPicker({ data, selectedValue, onChange, setName, placeholder = "Vyber z nabídky..." }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={[
      styles.pickerWrapper,
      { backgroundColor: isDark ? "#222" : "#fff" },
    ]}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(value: string) => {
          onChange(value);
          const selectedLabel = data.find(item => item.id === value)?.label;
          if (selectedLabel) setName(selectedLabel);
        }}
        dropdownIconColor={isDark ? "#fff" : "#000"}
        style={{ color: isDark ? "#fff" : "#000" }}
        themeVariant={isDark ? "dark" : "light"}
        {...({ } as any)}
      >
        <Picker.Item label={placeholder} value="" enabled={false} />
        {[...data]
          .sort((a, b) => a.label.localeCompare(b.label))
          .map(item => (
            <Picker.Item key={item.id} label={item.label} value={item.id} />
))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerWrapper: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    marginVertical: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
});