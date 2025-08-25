import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  icon?: React.ReactNode;
  backgroundColor?: string;
};

export default function MyButton({ title, onPress, icon, backgroundColor }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.button, backgroundColor && { backgroundColor }]}>
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.text}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#993769",
    padding: 12,
    borderRadius: 10,
    marginBottom: 40,
    width: "80%", 
    alignSelf: "center",
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