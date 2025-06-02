import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  icon?: React.ReactNode;
};

export default function MyButton({ title, onPress, icon }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.text}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "rgb(164, 91, 143)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 40,
    width: "80%", // <-- přidáno
    alignSelf: "center", // pro zarovnání doprostřed
  },
  text: {
    color: "white",
    fontSize: 18,
  },
  icon: {
    marginRight: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});