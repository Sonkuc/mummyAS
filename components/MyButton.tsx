import { GestureResponderEvent, Pressable, StyleSheet, Text } from "react-native";

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

export default function MyButton({ title, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "rgb(164, 91, 143)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 40,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 16,
  },
});