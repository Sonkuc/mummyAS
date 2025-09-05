import { KeyboardTypeOptions, StyleSheet, TextInput } from "react-native";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
};

export default function MyTextInput({ placeholder, value, onChangeText, keyboardType }: Props) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
  );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: "white",
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        borderColor: "#ccc",
        borderWidth: 1,
      },
});