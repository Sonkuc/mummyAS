import { MILESTONES } from "@/data/milestones";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  selectedMilestone: string;
  onChange: (id: string) => void;
  setName: (name: string) => void;
};

export default function MyPicker({ selectedMilestone, onChange, setName }: Props) {
  return (
 <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedMilestone}
          onValueChange={value => {
            onChange(value);
            const selectedLabel = MILESTONES.find(m => m.id === value)?.label;
            if (selectedLabel) setName(selectedLabel); // vyplní input podle výběru
          }}
        >
          <Picker.Item label="Vyber z nabídky..." value="" enabled={false} />
          {MILESTONES.map(m => (
            <Picker.Item key={m.id} label={m.label} value={m.id} />
          ))}
        </Picker>
      </View>
  );
}

const styles = StyleSheet.create({
    pickerWrapper: {
      borderWidth: 2,
      borderColor: "#bf5f82", 
      borderRadius: 10,
      marginVertical: 10,
      marginBottom: 15,
      overflow: "hidden", // zaoblí rohy i uvnitř
    },
})